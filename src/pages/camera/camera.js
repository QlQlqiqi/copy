const computedBehavior = require("miniprogram-computed").behavior;
const util = require("../../utils/util");
const store = require("../../store/store");
const app = getApp();

Component({
	behaviors: [computedBehavior],
	properties: {},

	data: {
		pageName: "",
		scores: [],
		messages: [],
	},

	methods: {
		handleBack(e) {
			wx.navigateBack();
		},
		post(picture) {
			console.log({
				url: this.data.url,
				method: "POST",
				data: JSON.stringify({
					picture,
					type: this.data.pageName,
				}),
			});
			return util.myRequest({
				url: this.data.url,
				method: "POST",
				data: JSON.stringify({
					picture,
					type: this.data.pageName,
				}),
			});
		},
		onLoad(option) {
			let { type } = option;
			let { navHeight, navTop, windowHeight, windowWidth } = app.globalData;
			this.setData({
				navHeight,
				navTop,
				windowHeight,
				windowWidth,
				ratio: 750 / windowWidth,
				bottomLineHeight: app.globalData.bottomLineHeight,
				noticeUpdateContent: app.globalData.noticeUpdateContent || false,
				pageName: type,
				url: app.globalData.addr,
			});
			this.ctx = wx.createCameraContext();

			// 每 3s 发送一次请求
			let _this = this;
			setInterval(() => {
				_this.ctx.takePhoto({
					quality: "high",
					success: res => {
						const fs = wx.getFileSystemManager();
						fs.readFile({
							filePath: res.tempImagePath,
							position: 0,
							success(res) {
								_this.post(res).then(res => {
									res = JSON.parse(res);
									const { paths, scores, messages } = res;
									// 记录结果
									_this.setData({
										paths,
										messages,
										scores,
									});
								});
							},
						});
					},
				});
			}, 2000);

			wx.createSelectorQuery()
				.select("#myCanvas")
				.fields({ node: true, size: true })
				.exec(res => {
					// Canvas 对象
					const canvas = res[0].node;
					console.log(canvas);
					if (!canvas) return;
					// 渲染上下文
					const ctx = canvas.getContext("2d");
					const width = res[0].width;
					const height = res[0].height;
					const dpr = wx.getWindowInfo().pixelRatio;
					canvas.width = width * dpr;
					canvas.height = height * dpr;
					ctx.scale(dpr, dpr);
					ctx.fillStyle = "#ff0000";
					_this.setData({
						ctx,
						width,
						height,
					});
				});

			setInterval(() => {
				this.drawPaths([
					[0, 0],
					[0.5, 0],
					[0.5, 0.5],
					[0, 0.5],
					[0, 0],
				]);
				setTimeout(() => {
					this.clearPaths();
				}, 1000);
			}, 500);
		},

		drawPaths(paths) {
			let { ctx, width, height } = this.data;
			if (!ctx) return;
			ctx.moveTo(paths[0][0] * width, paths[0][1] * height);
			for (let i = 1; i < paths.length; i++) {
				ctx.lineTo(paths[i][0] * width, paths[i][1] * height);
			}
			ctx.stroke();
		},
		clearPaths() {
			let { ctx, width, height } = this.data;
			if (!ctx) return;
			ctx.clearRect(0, 0, width, height);
		},
	},

	pageLifetimes: {
		hide() {
			let { scores, messages, pageName } = this.data;
			if (!scores.length) return;
			let finishedMotion = {
				scores,
				messages,
				type: pageName,
				date: new Date(),
			};
			let finishedMotions = JSON.parse(
				wx.getStorageSync("finishedMotions") || "[]"
			);
			finishedMotions.push(finishedMotion);
			wx.setStorageSync("finishedMotions", JSON.stringify(finishedMotions));
		},
	},
});
