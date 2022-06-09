const computedBehavior = require("miniprogram-computed").behavior;
const menuBehavior = require("../../behavior/menu-behavior");
const app = getApp();
const util = require("../../utils/util");
const store = require("../../store/store");
Component({
	behaviors: [computedBehavior, menuBehavior],
	options: {
		multipleSlots: true,
	},
	/**
	 * 组件的属性列表
	 */
	properties: {},

	/**
	 * 组件的初始数据
	 */
	data: {
		// 星星位置相关信息
		stars: [
			{ top: "70", left: "136" },
			{ top: "40", left: "216" },
			{ top: "16", left: "300" },
			{ top: "40", left: "386" },
			{ top: "70", left: "468" },
		],
		// 完成的任务
		finishedTasks: [],
		// 展示菜单
		showMenu: false,
		tasks: [],
		lists: [],
		showFeeling: false,
		finishedMotions: [],
	},

	computed: {
		finishedMotionsShow(data) {
			return data.finishedMotions.map(item => {
				return {
					content: `${item.type}: ${item.messages[0]}。（${item.scores[0]}分）`,
				};
			});
		},
		// 今日完成的任务（包括今日完成的未来事件）
		finishedTasks: function (data) {
			let todayDate = util.getDawn(0);
			let tommorrowDate = util.getDawn(1);
			let res = data.tasks.filter(function (item) {
				return (
					item.finish &&
					item.finishDate.localeCompare(todayDate) >= 0 &&
					item.finishDate.localeCompare(tommorrowDate) < 0
				);
			});
			res.sort((a, b) => a.date.localeCompare(b.date));
			return res;
		},
		// 设定星星数量
		starsNumber: function (data) {
			let sum = 0;
			data.finishedMotions.forEach(item => {
				sum += item.scores[0];
			})
			return Math.ceil(sum / data.finishedMotions.length / 20);
		},
		// 已完成任务的高度，单位：rpx
		contentHeight: function (data) {
			return (
				(app.globalData.windowHeight - app.globalData.navHeight - 58) *
					data.ratio -
				166 -
				142 -
				30 -
				40 -
				20 -
				app.globalData.bottomLineHeight * 2
			);
		},
	},

	watch: {},

	/**
	 * 组件的方法列表
	 */
	methods: {
		// 关闭背景遮掩
		handleCloseMask: function (e) {
			this.setData({
				showMenu: false,
				showFeeling: false,
			});
		},
		// 控制菜单的显示
		handleShowMenu: function (e) {
			this.setData({
				showMenu: true,
			});
		},
		// 进入历史页面
		handleNavigateToHistory: function (e) {
			wx.navigateTo({
				url: "/src/pages/history/history",
			});
		},
		// 控制选择某个任务编辑，并打开输入框
		handleSelectTask: function (e) {
			const index = e.currentTarget.dataset.index;
			let task = this.data.finishedMotions[index];
			this._selectedId = index;
			this.setData({
				showFeeling: true,
				feeling: task.feeling || "",
				rating: task.rating || 1,
			});
		},
		// 改变任务完成满意度
		handleChangeRating: function (e) {
			this.setData({
				rating: e.detail.rating,
			});
		},
		// 改变任务感想
		handleInput: function (e) {
			this.setData({
				feeling: e.detail.value,
			});
		},
		// 关闭感想输入框
		handleBackFeeling: function () {
			delete this._selectedId;
			this.setData({
				showFeeling: false,
			});
		},
		// 保存输入框信息
		handleEnsureFeeling: async function () {
			
			wx.showLoading({
				title: "正在保存数据...",
				mask: true,
			});
			// let { owner, token } = await util.getTokenAndOwner(
			// 	app.globalData.url + "login/login/"
			// );
			let task = this.data.finishedMotions[this._selectedId];
			task.feeling = this.data.feeling;
			task.rating = this.data.rating;
			// await store.saveTasksToSql([task], this.data.lists, { owner, token });
			let key = `finishedMotions[${this._selectedId}]`;
			this.setData({
				[key]: task,
				feeling: task.feeling,
				showFeeling: false,
			});
			wx.setStorageSync("finishedMotions", JSON.stringify(this.data.finishedMotions));
			wx.hideLoading({
				success: () => {
					wx.showToast({
						title: "已完成",
						duration: 800,
					});
				},
			});
		},
		// 导航到 add-chat 页面，并展示缩略图
		handleNavigateToAddChatAndShowReview(e) {
			wx.setStorageSync(
				"chats",
				wx.getStorageSync("chats") || JSON.stringify([])
			);
			wx.navigateTo({
				url: "/src/pages/add-chat/add-chat?reviewShow=" + JSON.stringify(true),
			});
		},
		// 从本地获取全部数据
		_getAllDataFromLocal: function () {
			let finishedMotions = JSON.parse(
				wx.getStorageSync("finishedMotions") || "[]"
			);
			// 获取任务
			let tasks = JSON.parse(wx.getStorageSync("tasks") || JSON.stringify([]));
			// 获取清单
			let lists = JSON.parse(wx.getStorageSync("lists") || JSON.stringify([]));
			// 用户昵称
			let signText = JSON.parse(
				wx.getStorageSync("signText") || JSON.stringify("")
			);
			this.setData({
				tasks: tasks,
				lists: lists,
				signText: signText,
				finishedMotions,
			});
			console.log(this.data);
		},
		// 拉取并设置数据
		onLoad: function () {
			// 设置机型相关信息
			let {
				navHeight,
				navTop,
				windowHeight,
				windowWidth,
				bottomLineHeight,
			} = app.globalData;

			this.setData({
				navHeight,
				navTop,
				windowHeight,
				windowWidth,
				ratio: 750 / windowWidth,
				bottomLineHeight,
			});
		},
	},

	/**
	 * 组件所在页面生命周期
	 */
	pageLifetimes: {
		show: function () {
			this._getAllDataFromLocal();
			// 切换 tabbar 时候显示该页面
			this.getTabBar().setData({
				selected: 1,
			});
		},
		hide: function () {},
	},

	/**
	 * 组件生命周期
	 */
	lifetimes: {},
});
