# 百度日历 Windows 桌面小组件 (Baidu Calendar Desktop Widget)

<p align="center">
  <img src="public/icon.png" width="128" height="128" alt="百度日历桌面小组件图标" />
</p>

<p align="center">
  <strong>高度还原百度开放数据平台日历的 Windows 原生桌面透明挂件应用</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Platform-Windows-0078D6?logo=windows" alt="Platform Windows" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Electron-Desktop-47848F?logo=electron" alt="Electron" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite" alt="Vite" />
  <img src="https://img.shields.io/badge/License-CC0--1.0-blue.svg" alt="License: CC0-1.0" />
</p>

---

## 📖 项目简介

**百度日历桌面小组件** 是一款专为 Windows 桌面打造的常驻悬浮挂件应用。小组件高度还原了百度搜索开放数据平台的日历、传统老黄历、法定节假日调休排班与倒计时功能。

应用支持无边框透明渲染、桌面壁纸深度融合、系统托盘常驻管理，并针对桌面小组件长时间挂机运行的场景进行了**极致的低内存占用调优**，在不牺牲任何功能的前提下，实现极低的资源消耗与纯净的视觉体验。

---

## ✨ 核心特性

### 1. 📅 百度日历与老黄历全功能还原
- **传统农历与黄历详解**：支持天干地支、生肖年、五行纳音、二十四节气、九星宿、冲煞、胎神、吉神宜趋、凶煞宜忌、彭祖百忌以及十二时辰吉凶速览。
- **法定节假日调休标记**：精准标注中国法定节假日（元旦、春节、清明、劳动、端午、中秋、国庆）的「休」假与「班」调休上班安排。
- **下个假期实时倒计时**：底部卡片动态计算并展示距离下一个法定假日的剩余天数。
- **百度数据与离线高精度兜底**：优先连接百度开放数据平台 API，断网或离线环境下自动无缝切换至高精度农历历法引擎计算。

### 2. 🖼️ 桌面壁纸融合与交互体系
- **锁定融入壁纸模式**：锁定后窗口启用鼠标穿透（`ignoreMouseEvents`），挂件完全与桌面壁纸合二为一，鼠标可直接穿透点击下方的桌面图标与应用，彻底防止误触。
- **解锁自由拖拽**：在系统托盘一键解锁后，可在屏幕任意位置自由拖拽摆放小组件，位置坐标持久化自动保存。
- **无任务栏打扰**：纯净桌面挂件设计，不占用 Windows 任务栏位置，仅常驻系统托盘。
- **多档透明度调节**：支持 100%（不透明）、90%（轻微磨砂）、80%（透亮悬浮）、70%（极简通透）随时调节。
- **纯净无边框设计**：去除了所有方形黑框与半透明毛玻璃虚边，老黄历弹窗采用卡片内嵌视图，平滑优雅。

### 3. ⚡ 极致运行内存占用优化
针对 Electron 默认占用 200MB+ 内存的痛点，应用实施了多项系统级低内存优化：
- **V8 Lite-Mode 瘦身**：关闭激进的 JIT TurboFan 编译与冗余反馈向量，代码生成尺寸优先，大幅削减堆内存；
- **老生代上限限制**：严格限制 V8 堆内存上限（48MB），促使引擎提前回收垃圾，避免内存膨胀；
- **子系统深度裁剪**：关闭拼写检查字典库（`spellcheck: false`，节省 25MB+）、WebGL 3D 上下文池、后台预取网络、遥测组件与着色器磁盘缓存；
- **智能生命周期回收**：启动 2 秒后自动收敛初始化内存；进入“锁定融入壁纸”状态时立即触发垃圾回收；每 60 秒后台静默整理会话缓存；
- **一键深度清理**：系统托盘提供「⚡ 深度清理运行内存」指令，随时释放会话缓存与 V8 垃圾对象。

### 4. 🎨 统一专属日历图标
- 安装包（`Setup.exe`）、免安装绿色便携包（`Portable.exe`）、桌面快捷方式、窗口与系统托盘均统一采用高清红顶白底蓝网格的专属日历图标资产（`public/icon.ico` / `public/icon.png`）。

---

## 🖥️ 系统托盘功能说明

在 Windows 任务栏右下角找到小组件的**日历托盘图标**，右键点击即可调出功能菜单：

| 菜单项 | 说明 |
| :--- | :--- |
| **显示/隐藏小组件** | 随时切换桌面上小组件的可见状态 |
| **改变位置** | 切换「🔓 解锁以自由拖动改变位置」或「🔒 锁定当前位置并融入壁纸」 |
| **背景透明度** | 支持 100%、90%、80%、70% 四档背景透光度切换 |
| **⚡ 深度清理运行内存** | 强制执行会话缓存释放与 V8 垃圾回收，快速压降内存 |
| **开机自启动** | 勾选即可在开机进入系统后自动启动并贴在桌面 |
| **退出应用** | 彻底退出小组件程序 |

---

## 🚀 运行形态与使用方式

本项目支持三种运行形态，您可以根据需要自由选择：

### 方式一：下载 Windows 原生 EXE 安装包 / 便携单文件（推荐）
在 GitHub 仓库的 **Releases** 页面即可下载官方构建的 Windows 执行文件：
- **`BaiduCalendarDesktop-Setup-v1.0.x.exe`**：标准 NSIS 安装向导版，支持自定义安装路径并自动创建桌面快捷方式。
- **`BaiduCalendarDesktop-Portable-v1.0.x.exe`**：绿色免安装便携版，单文件即开即用，适合 U 盘随身携带或免安装场景。

### 方式二：PWA 独立桌面窗口（免下载客户端）
1. 使用 **Microsoft Edge** 或 **Google Chrome** 打开 Web 端网页。
2. 点击浏览器地址栏右侧的 **“应用已可安装”** 图标（或菜单 `...` → **应用** → **将此站点作为应用安装**）。
3. 勾选“创建桌面快捷方式”，即可获得独立无浏览器地址栏的桌面窗口。

### 方式三：Python 极简原生挂件（PyWebView）
通过 Python 原生 Webview 渲染，仅需约 15 行代码：
```python
# pip install pywebview
import webview

if __name__ == '__main__':
    window = webview.create_window(
        title='百度日历桌面小组件',
        url='http://localhost:3000', # 或线上地址
        width=485,
        height=675,
        x=28,
        y=28,
        frameless=True,       # 无边框，与桌面完美融合
        easy_drag=False,      # 使用网页内置的拖拽锁定系统
        on_top=False,         # 贴合在桌面背景层
        transparent=True,     # 透明毛玻璃支持
        background_color='#00000000'
    )
    webview.start()
```

---

## 🛠️ 本地开发与构建指南

### 1. 运行环境要求
- **Node.js**：>= 18.0.0
- **npm**：>= 9.0.0

### 2. 克隆与安装依赖
```bash
git clone <repository-url>
cd baidu-calendar-desktop

# 安装项目依赖
npm install
```

### 3. 本地启动开发服务器
```bash
npm run dev
```
启动后在浏览器中访问 `http://localhost:3000` 即可预览完整日历小组件功能。

### 4. 生产前端构建
```bash
npm run build
```

### 5. 打包生成 Windows 原生 EXE 安装包
```bash
npm run build:exe
```
执行后 `electron-builder` 会自动在 `release/` 目录下生成：
- `release/BaiduCalendarDesktop-Setup-v1.0.0.exe`
- `release/BaiduCalendarDesktop-Portable-v1.0.0.exe`

---

## ⚙️ CI/CD 自动化构建发布

项目内置配置了完整的 GitHub Actions 工作流（`.github/workflows/build-exe.yml`）：
- 当推送代码至 `main` 分支或创建版本 Release Tag（如 `v1.0.1`）时，GitHub Actions 会自动在 `windows-latest` 虚拟机中执行编译与打包；
- 产物包名称会自动统一规范化为：
  - `BaiduCalendarDesktop-Setup-${TAG}.exe`
  - `BaiduCalendarDesktop-Portable-${TAG}.exe`
- 打包完成后自动上传至 Actions Artifacts 并发布至 GitHub Releases 资源附件。

---

## 🧱 技术栈组成

| 领域 | 核心技术 | 说明 |
| :--- | :--- | :--- |
| **UI 视图层** | React 19 + TypeScript | 函数式组件、Hooks 响应式状态管理 |
| **样式与动效** | Tailwind CSS v4 + Motion | 现代原子化 CSS、平滑的卡片过渡与无毛玻璃纯净设计 |
| **日历与历法** | lunar-typescript | 传统农历、二十四节气、干支纪年、黄历宜忌离线运算 |
| **桌面运行时** | Electron 34+ | Windows 无边框透明窗口、系统托盘、IPC 进程通信与鼠标穿透 |
| **打包分发** | electron-builder + NSIS | Windows x64 安装包、免安装单文件便携包构建 |
| **图标与资产** | Lucide Icons + Custom ICO | 专属多尺寸 Windows 图标（含 16~256px 各级分辨率） |
| **服务端** | Node.js + Express | 百度开放数据平台 API 安全代理、LRU 内存防泄漏缓存 |

---

## 📄 开源许可证

本项目基于 [CC0 1.0 Universal (CC0 1.0) 公共领域贡献协议](LICENSE) 开源发布。

您可以自由地复制、修改、分发及用于商业用途，无需获取许可或署名。
