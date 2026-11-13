# 三阶魔方公式库

一个白色、宽松排版的中文三阶魔方公式图鉴。使用 React、TypeScript、Vite 与 cubing.js，公式数据随项目本地打包，运行时无需连接公式网站。

**在线体验：** https://3zrbkidxebhdu.ok.kimi.link

## 内容

- 标准 F2L：41 案，并提供前右、前左、后左、后右四个槽向，共 164 个展示情况。
- 非标 F2L：54 个基础情况，四向共 216 个展示情况。
- OLL：57 案。
- PLL：21 案。
- ZBLL：472 个独立案件，加上 21 个 PLL 重合案件，构成 493 案学习视图。
- 全站共 3,408 条去重公式记录；保留常见推荐与备选公式。

每条公式均有独立的 3D 初始状态，支持拖动旋转、滚轮缩放、播放暂停、前后单步、进度拖动、五档速度和复位。分类卡片使用与详情页相同的 3D 播放器，并按可视区域加载和释放。

搜索、筛选、复制、收藏、学习状态与分类进度均可在页面中使用；学习数据仅保存在当前浏览器的 localStorage，不会跨设备同步。

## 本地运行

需要 Node.js 20 或兼容版本。

```bash
git clone https://github.com/tyc6886/cube-formula-atlas.git
cd cube-formula-atlas
npm ci
npm run dev
```

生产构建与预览：

```bash
npm run build
npm run preview
```

## 校验

```bash
npm run lint
npm run test:data
npm run build
npm run test:browser
```

`test:data` 使用 cubing.js 逐条解析全部公式，并验证目标状态经逆公式、正公式后复原，同时检查案例与公式 ID、930 个槽向变体、四向数量、公式步数及播放器分步数量。

`test:browser` 使用本机 Microsoft Edge 验收 375、768、1024 与 1440 px 页面、所有分类及代表性 3D 详情、核心交互和本地数据容错，截图输出到 `test-results/screenshots/`。如 Edge 安装路径不同，请调整 `scripts/verify-browser.mjs` 中的 `executablePath`。运行前需先执行 `npm run build`。

## 数据来源与许可证

公式与技术来源见 [CREDITS.md](./CREDITS.md)，每个公式详情页也保留对应原始情况链接。

项目源码采用 [MIT License](./LICENSE)。第三方依赖、公式数据及来源内容仍遵循各自来源的条款，MIT 许可证不替代这些条款。
