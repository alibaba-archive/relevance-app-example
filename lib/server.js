/**
 * 关联插件示例：知乎日报关联
 * 查询知乎日报主题列表，加载文章列表，并关联到 Teambition 对象中
 */
'use strict'

const Koa = require('koa')
const router = require('koa-router')()
const request = require('request-promise')
const auth = require('./auth')

const app = new Koa()

// 注册插件的 id, secret
const clientId = ''
const clientSecret = ''
const baseUrl = 'http://192.168.0.82:8080'

// 加载菜单项目
router.get('/themes', function * () {
  let data = yield request({
    method: 'GET',
    url: 'http://news-at.zhihu.com/api/4/themes',
    json: true
  }).then(function (body) {
    return body.others.map(function (theme) {
      return {
        title: theme.name,
        itemsUrl: baseUrl + `/themes/${theme.id}/stories`
      }
    })
  })
  this.body = data
})

// 加载每个菜单下的关联项目
router.get('/themes/:id/stories', function * () {
  let url = `http://news-at.zhihu.com/api/4/theme/${this.params.id}`
  // 在 url 中添加分页参数，如果不支持分页则忽略
  if (this.request.query.count && this.request.query.page) {
    url += `?page=${this.request.query.page}&count=${this.request.query.count}`
  }
  let data = yield request({
    method: 'GET',
    url: url,
    json: true
  }).then(function (body) {
    return body.stories.map(function (story) {
      let data = {
        title: story.title,
        redirectUrl: `http://daily.zhihu.com/story/${story.id}`
      }
      // 添加缩略图链接
      if (story.images && story.images.length) {
        data.thumbnailUrl = story.images[0]
      }
      return data
    })
  })
  this.body = data
})

// 可选：加载权限验证中间件
// 通过 header X-Teambition-Sign 验证 Teambition 用户 id
app.use(auth({
  clientId: clientId,
  clientSecret: clientSecret
}))

app.use(router.routes())

app.listen(8080, function () {
  console.log('Server listen on 8080')
})
