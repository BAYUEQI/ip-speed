# ip-speed - 高性能云服务IP查询与测速工具

[![Deploy to Cloudflare Pages](https://deploy.cloudflare.com/button.svg)](https://deploy.cloudflare.com/?url=https://github.com/BAYUEQI/ip-speed)

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

ip-speed 是一个功能强大的 Web 工具，为用户提供了 Cloudflare IP 地址查询和网络测速功能。它允许用户快速获取和测试各种 Cloudflare IP 地址，并提供直观的网络性能测试。

> 本项目基于 [ymyuuu](https://github.com/ymyuuu) 开发的 [IPDB](https://github.com/ymyuuu/IPDB) 和 [Spurl-API](https://github.com/ymyuuu/Spurl-API) 工具构建。

## ✨ 主要功能

### 📡 IP 查询功能
- **多种 IP 类型支持**：
  - Cloudflare IPv4 地址列表
  - Cloudflare IPv6 地址列表
  - Cloudflare 反代 IP 地址列表
  - 优选 Cloudflare 官方 IP
  - 优选 Cloudflare 反代 IP
- **地理位置信息**：显示 IP 地址所属国家/地区代码
- **结果下载**：支持将查询结果下载为文本文件
- **跨域代理**：内置多种代理方式解决跨域问题
- **批量查询**：支持同时查询多种类型的 IP 地址

### 🚀 网络测速功能
- **灵活测速**：支持从 B、KB、MB 到 GB 的自定义下载大小测试
- **实时监控**：显示下载进度、速度和耗时
- **结果分析**：提供详细的测速结果报告
- **操作控制**：可随时停止测速过程

## 🔧 使用指南

### IP 查询
1. 选择需要查询的 IP 类型（可多选）
2. 勾选是否显示地理位置信息
3. 选择是否需要下载为文件（可选）
4. 如遇跨域问题，勾选"使用代理解决跨域问题"
5. 点击"查询"按钮获取结果
6. 可复制或下载查询结果

### 网络测速
1. 设置测试下载的文件大小和单位
2. 勾选是否显示下载进度（可选）
3. 点击"开始测速"按钮
4. 查看实时测速结果
5. 测试完成后可复制测速结果

## 📊 API 说明

### IPDB API
- 基本 URL: `https://ipdb.api.030101.xyz`
- 参数说明:
  - `type`: 指定 IP 类型，支持 cfv4、cfv6、proxy、bestcf、bestproxy
  - `country`: 设置为 true 时显示地理位置信息
  - `down`: 设置为 true 时下载文件而非直接返回内容

```
示例: https://ipdb.api.030101.xyz/?type=bestproxy&country=true
```

### Spurl API
- 基本 URL: `https://spurl.api.030101.xyz`
- 支持格式:
  - 字节: `/数字`
  - KB: `/数字kb`
  - MB: `/数字mb`
  - GB: `/数字gb`

```
示例: https://spurl.api.030101.xyz/10mb
```

## 💻 技术实现

- **前端技术**:
  - 纯原生 HTML5, CSS3 和 JavaScript (ES6+)
  - 响应式设计，支持移动设备
  - 动画和交互效果优化
  
- **API 调用**:
  - 使用 Fetch API 进行异步数据请求
  - 流式下载处理
  - 支持多种代理方式解决跨域
  
- **性能优化**:
  - 延迟加载和按需执行
  - 流畅的动画效果
  - 针对移动设备的优化

## 🌟 特色亮点

- **直观界面**: 简洁清晰的用户界面，便于使用
- **高度定制**: 多种选项和配置满足不同需求
- **全面兼容**: 支持各种现代浏览器
- **无服务器依赖**: 纯客户端实现，可在本地运行

## 📝 本地运行

直接在现代浏览器中打开 `index.html` 文件即可使用。支持 Chrome、Firefox、Edge 和 Safari 等主流浏览器。

## 📜 许可证

本项目采用 MIT 许可证。详情请参阅 LICENSE 文件。

---

### 🔗 相关链接
- [IPDB](https://github.com/ymyuuu/IPDB) - Cloudflare反代优选IP库
- [Spurl-API](https://github.com/ymyuuu/Spurl-API) - Spurl下载测速链接

### 👨‍💻 贡献
欢迎通过 Issue 和 Pull Request 贡献代码或提出建议。 

## 🚀 一键部署到 Cloudflare Pages

点击下方按钮，自动将本项目 fork 并部署到你的 Cloudflare Pages：

[![Deploy to Cloudflare Pages](https://deploy.cloudflare.com/button.svg)](https://deploy.cloudflare.com/?url=https://github.com/BAYUEQI/ip-speed)

#### 手动部署步骤

1. Fork 本仓库到你的 GitHub 账号
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/)
3. 选择 "Connect to Git" 绑定你的仓库
4. 构建设置：
   - **Framework Preset**: None
   - **Build command**: （留空）
   - **Output directory**: `./`
5. 部署完成后即可访问你的专属 ip-speed 工具页面
