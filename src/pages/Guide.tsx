import { ExternalLink } from 'lucide-react'

const notation = [
  ['U', '顶层顺时针'], ['D', '底层顺时针'], ['R', '右层顺时针'], ['L', '左层顺时针'], ['F', '前层顺时针'], ['B', '后层顺时针'],
  ["R′", '反向旋转 90°'], ['U2', '旋转 180°'], ['r / Rw', '右面两层一起转'], ['M', 'R 与 L 之间的中层'], ['x y z', '整个魔方转向'], ['( )', '帮助分组，不改变执行顺序'],
]

export default function Guide() {
  return <div className="guide-page">
    <header className="page-heading"><div><div className="breadcrumb">学习帮助</div><h1>记号、方向与来源</h1><p>先统一阅读方式，再开始记忆公式。</p></div></header>
    <section className="guide-intro"><div><span className="section-kicker">默认观察方向</span><h2>黄顶、蓝前，从情况状态开始。</h2><p>3D 播放器将每条公式的终点设为对应阶段的完成状态，再反向构造初始情况。因此点击播放后，看到的正是这条公式如何完成当前阶段。</p><p>顺逆时针均以正对该面时的视角判断。拖动模型只改变观察角度，不会改变公式状态。</p></div><div className="orientation-cube" aria-hidden="true"><div className="orientation-top">黄</div><div className="orientation-front">蓝</div><div className="orientation-right">红</div></div></section>
    <section className="notation-section"><div className="section-heading compact"><div><span className="section-kicker">Singmaster 记号</span><h2>常见符号速查</h2></div></div><div className="notation-grid">{notation.map(([symbol, description]) => <div key={symbol}><code>{symbol}</code><span>{description}</span></div>)}</div></section>
    <section className="source-cards"><div><span className="section-kicker">公式数据</span><h2>SpeedCubeDB</h2><p>本站以其公开目录为公式主来源，收录推荐及常见备选公式。标准数量与 ZBLL 分组同时参考 SpeedSolving Wiki 等公开资料核对。</p><a href="https://speedcubedb.com/a/3x3" target="_blank" rel="noreferrer">访问公式来源<ExternalLink /></a></div><div><span className="section-kicker">3D 与公式校验</span><h2>cubing.js</h2><p>使用 cubing.js 解析 Singmaster 记号、计算魔方状态并渲染可旋转的 3D 播放器。全部入库公式均经过解析检查。</p><a href="https://js.cubing.net/cubing/twisty/" target="_blank" rel="noreferrer">查看技术文档<ExternalLink /></a></div></section>
    <section className="guide-note"><h2>关于公式选择</h2><p>“推荐”表示来源目录中排序靠前的常用方案，并不意味着对每位玩家都绝对最优。手型、惯用手和转体习惯不同，可以在备选公式中选择更顺手的一条。</p><p>本站不宣称收集互联网上所有可能变体；收录范围以公开主目录及其常见备选为准。收藏与学习进度仅保存在当前浏览器。</p></section>
  </div>
}
