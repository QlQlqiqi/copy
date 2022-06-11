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
		post(image) {
			return util.myRequest({
				url: "http://192.168.31.195:5000/JudgeScore",
				method: "POST",
				data: {
					image,
					type: 0,
					// type: this.data. id,
				},
			});
		},
		onLoad(option) {
			let { pageName, id } = option;
			let { navHeight, navTop, windowHeight, windowWidth } = app.globalData;

			this.setData({
				navHeight,
				navTop,
				windowHeight,
				windowWidth,
				ratio: 750 / windowWidth,
				bottomLineHeight: app.globalData.bottomLineHeight,
				noticeUpdateContent: app.globalData.noticeUpdateContent || false,
				pageName,
				url: app.globalData.addr,
				id,
			});
			this.ctx = wx.createCameraContext();

			

			// 每 3s 发送一次请求
			let _this = this;
			setInterval(() => {
				_this.ctx.takePhoto({
					quality: "high",
					success: res => {
						console.log(res);
						wx.getImageInfo({
							src: res.tempImagePath,
							success(res) {
								_this.setData({
									imgWidth: res.width,
									imgHeight: res.height,
								});
								// const ctx = _this.data.ctx;
								// if(!ctx)	return;
								// ctx.moveTo(0.3 * res.width / 1.66, 0.3 * res.height / 1.66);
								// ctx.lineTo(0.5 * res.width / 1.66, 0.5 * res.height / 1.66);
								// ctx.stroke();
							},
						});
						const fs = wx.getFileSystemManager();
						fs.readFile({
							filePath: res.tempImagePath,
							// filePath: `${wx.env.USER_DATA_PATH}/2.jpg`,
							encoding: "base64",
							position: 0,
							success(res) {
								console.log(res);
								_this.post(res.data).then(res => {
									console.log(res);
									let { points, score, messages } = res.data;
									messages = messages || "好";
									// 记录结果
									_this.setData({
										paths: points,
										messages,
										scores: score,
									});
									_this.drawPaths(points);
									// setTimeout(() => {
									// 	_this.clearPaths();
									// }, 300);
								});
							},
						});
					},
				});
			}, 300);

			setInterval(() => {
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
						canvas.width = width * 1;
						canvas.height = height * 1;
						ctx.scale(1, 1);
						ctx.fillStyle = "#ff0000";
						_this.setData({
							ctx,
							width,
							height,
						});
					});
			}, 100);
		},

		drawPaths(paths) {
			if (!paths || paths.length != 33) return;
			// 详见https://github.com/PixelChen24/YogaServer
			this.drawPathsFromTo(paths, [8, 6, 5, 4, 0, 1, 2, 3, 7]);
			this.drawPathsFromTo(paths, [9, 10]);
			this.drawPathsFromTo(paths, [8, 6, 5, 4, 0, 1, 2, 3, 7]);
			this.drawPathsFromTo(paths, [
				22,
				16,
				20,
				18,
				16,
				14,
				12,
				11,
				13,
				15,
				17,
				19,
				15,
				21,
			]);
			this.drawPathsFromTo(paths, [12, 24, 26, 28, 30, 32, 28]);
			this.drawPathsFromTo(paths, [11, 23, 25, 27, 31, 29, 27]);
			this.drawPathsFromTo(paths, [23, 24]);
		},

		// 根据下标顺序连接
		drawPathsFromTo(paths, order) {
			let { ctx, imgWidth, imgHeight, width, height, navHeight } = this.data;
			if (!ctx) return;
			ctx.moveTo(
				(paths[order[0]][0] * width) / 1,
				(paths[order[0]][1] * height) / 1
			);
			for (let i = 1; i < order.length; i++)
				ctx.lineTo(
					(paths[order[i]][0] * width) / 1,
					(paths[order[i]][1] * height) / 1
				);
			ctx.stroke();
		},

		clearPaths() {
			let { ctx, width, height } = this.data;
			if (!ctx) return;
			ctx.clearRect(0, 0, width, height);
		},
		onUnload() {
			let { scores, messages, pageName } = this.data;
			if (!scores.length) return;
			let sum = 0;
			scores.forEach(item => sum += item);
			sum /= scores.length;
			scores = sum * 100;
			messages = messages || "暂无评价";
			let finishedMotion = {
				messages,
				scores: [scores],
				type: pageName,
				date: new Date(),
			};
			let finishedMotions = JSON.parse(
				wx.getStorageSync("finishedMotions") || "[]"
			);
			finishedMotions.push(finishedMotion);
			wx.setStorageSync("finishedMotions", JSON.stringify(finishedMotions));
		}
	},
});
