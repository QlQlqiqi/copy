const computedBehavior = require("miniprogram-computed").behavior;
let app = getApp();
const util = require("../../utils/util");
Component({
	behaviors: [computedBehavior],
	/**
	 * 组件的属性列表
	 */
	properties: {},

	/**
	 * 组件的初始数据
	 */
	data: {
		dateString: "",
		defaultTime: "",
		tasks: [],
		// 星星位置相关信息
		stars: [
			{ top: "42", left: "222" },
			{ top: "20", left: "282" },
			{ top: "0", left: "350" },
			{ top: "20", left: "416" },
			{ top: "42", left: "480" },
		],
		// 选定的任务
		task: {},
		// 显示感想
		showFeeling: false,
		finishedMotions: [],
	},

	computed: {
		// 从小到大得到所有已完成任务出现的日期，如果某天未完成任务，则不显示 spot
		spot: function (data) {
			let res = [];
			for (let task of data.tasks) {
				if (!task.finish) continue;
				let finishDate = task.finishDate.substr(0, 10);
				if (res.indexOf(finishDate) === -1) res.push(finishDate);
			}
			res.sort((a, b) => {
				return a.localeCompare(b);
			});
			return res;
		},
		// 今日事件
		todayTasks: function (data) {
			let todayDateYMD = data.dateString;
			let tommorrowDateYMD = util
				.formatDate(
					new Date(new Date(data.dateString).getTime() + 24 * 60 * 60 * 1000)
				)
				.substr(0, 10);
			let res = data.tasks.filter(function (item) {
				return (
					item.date.localeCompare(todayDateYMD) >= 0 &&
					item.date.localeCompare(tommorrowDateYMD) < 0
				);
			});
			res.sort((a, b) =>
				a.priority !== b.priority
					? a.priority < b.priority
						? -1
						: 1
					: a.date.localeCompare(b.date)
			);
			return res;
		},
		// 今日完成的任务（包括今日完成的未来事件）
		finishedMotionsShow: function (data) {
			let todayDateYMD = data.dateString;
			let tommorrowDateYMD = util
				.formatDate(
					new Date(new Date(data.dateString).getTime() + 24 * 60 * 60 * 1000)
				)
				.substr(0, 10);
			return data.finishedMotions
				.filter(item => {
					return (
						item.date.localeCompare(todayDateYMD) >= 0 &&
						item.date.localeCompare(tommorrowDateYMD) < 0
					);
				})
				.map(item => {
					return {
						content: `${item.type}: ${item.messages[0]}。（${item.scores[0]}分）`,
						date: util.formatDate(new Date(item.date)),
					};
				});
		},
		// 设定星星数量
		starsNumber: function (data) {
			let sum = 0;
			data.finishedMotions.forEach(item => {
				sum += item.scores[0];
			});
			return 5;
		},
	},

	/**
	 * 组件的方法列表
	 */
	methods: {
		// 关闭背景遮掩
		handleCloseMask: function (e) {
			this.setData({
				showFeeling: false,
			});
		},
		// 点击任务，展开感想
		handleSelectTask: function (e) {
			let task = this.data.finishedMotions[e.currentTarget.dataset.index];
			this.setData({
				showFeeling: true,
				task: task,
			});
		},
		// 关闭任务
		handleBackFeeling: function (e) {
			this.setData({
				showFeeling: false,
			});
		},
		// 选中日期改变
		handleDateChange(e) {
			this.setData({
				dateString: e.detail.dateString,
			});
		},
		// 返回
		handleBack: function (e) {
			wx.navigateBack();
		},
		// 处理数据
		onLoad: function (options) {
			// 默认时间
			let date = new Date();
			let defaultTime = `${date.getFullYear()}/${
				date.getMonth() + 1
			}/${date.getDate()}`;
			this.setData({
				// tasks: JSON.parse(wx.getStorageSync("tasks")),
				finishedMotions: JSON.parse(
					wx.getStorageSync("finishedMotions") || "[]"
				),
				defaultTime: defaultTime,
				navHeight: app.globalData.navHeight,
				navTop: app.globalData.navTop,
				windowHeight: app.globalData.windowHeight,
				windowWidth: app.globalData.windowWidth,
			});
		},
	},
});
