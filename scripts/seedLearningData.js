const database = require("../db");

const subjects = parseRows(`
the federal government|联邦政府
the state government|州政府
the local council|地方议会
the university|这所大学
the research team|研究团队
the independent commission|独立委员会
the regional hospital|地区医院
the environmental agency|环境机构
the community organisation|社区组织
the parliamentary committee|议会委员会
`);

const levelConfigs = [
  {
    level: 1,
    nouns: `
access|获取机会、使用权
accommodation|住宿、调和
accountability|问责制
adaptation|适应、改编
adversity|逆境
allocation|分配
ambiguity|模糊性、歧义
anticipation|预期、期待
capacity|能力、容量
collaboration|协作
commitment|承诺、投入
compensation|补偿
complexity|复杂性
compromise|妥协、折中
conservation|保护、节约
constraint|限制因素
consultation|磋商、咨询
controversy|争议
credibility|可信度
criterion|标准、准则
deficiency|缺陷、不足
diversity|多样性
efficiency|效率
emphasis|强调、重点
exposure|接触、暴露
equality|平等
evidence|证据
flexibility|灵活性
implication|潜在影响、含义
incentive|激励措施
innovation|创新
integrity|诚信、完整性
interpretation|解释、理解
intervention|干预
limitation|限制
maintenance|维护
perspective|视角
priority|优先事项
resilience|韧性、复原力
sustainability|可持续性
`,
    adjectives: `
abundant|丰富的
accessible|可获得的、易懂的
accountable|负有责任的
adaptable|适应性强的
adequate|足够的、合格的
ambiguous|模棱两可的
apparent|明显的、表面上的
appropriate|合适的
beneficial|有益的
capable|有能力的
coherent|连贯的
compelling|令人信服的
comprehensive|全面的
considerable|相当大的
consistent|一致的、持续的
controversial|有争议的
credible|可信的
crucial|至关重要的
diverse|多样的
efficient|高效的
equivalent|等同的
ethical|合乎道德的
evident|明显的
feasible|可行的
flexible|灵活的
inevitable|不可避免的
innovative|创新的
persistent|持续的、执着的
relevant|相关的
sustainable|可持续的
`,
    verbs: `
acknowledge|承认
adapt|调整、适应
allocate|分配
anticipate|预期
assess|评估
clarify|澄清
collaborate|合作
compensate|补偿
conserve|保护、节约
constrain|限制
consult|征询
demonstrate|证明、展示
emphasise|强调
encounter|遭遇
enhance|提升
evaluate|评价
facilitate|促进
implement|实施
imply|暗示
maintain|维持
negotiate|协商
prioritise|优先处理
regulate|监管
reinforce|加强
resolve|解决
`,
    adverbs: `
accordingly|相应地
cautiously|谨慎地
consistently|一贯地
deliberately|有意地、审慎地
inevitably|不可避免地
`,
    verbObjects: `
the community's concern|社区的担忧
the existing framework|现有框架
additional resources|额外资源
future demand|未来需求
the available evidence|现有证据
the main objective|主要目标
with regional partners|与地区合作伙伴
affected residents|受影响的居民
limited water supplies|有限的供水
unnecessary spending|不必要的支出
local communities|当地社区
its commitment|其承诺
the long-term benefits|长期利益
unexpected resistance|意外阻力
public access|公众获取机会
the available options|现有选项
open discussion|公开讨论
the revised policy|修订后的政策
a significant change|一项重大变化
public confidence|公众信任
a fair settlement|公平的解决方案
urgent needs|紧迫需求
short-term rentals|短期租赁
safety standards|安全标准
the disagreement|分歧
`,
    phraseMeanings: `
承认社区的担忧
调整现有框架
分配额外资源
预估未来需求
评估现有证据
澄清主要目标
与地区伙伴合作
补偿受影响的居民
节约有限的水资源
限制不必要支出
征询当地社区意见
展现其承诺
强调长期利益
遭遇意外阻力
改善公众获取机会
评估现有选项
促进公开讨论
实施修订后的政策
意味着一项重大变化
维持公众信任
协商达成公平的解决方案
优先处理紧迫需求
监管短期租赁
强化安全标准
解决分歧
`,
    starters: `
in the long run|从长远来看
on balance|综合考虑
in practical terms|从实际角度而言
from a broader perspective|从更广阔的视角来看
in response to public concern|为回应公众关切
with limited resources|在资源有限的情况下
according to the latest evidence|根据最新证据
despite initial resistance|尽管最初存在阻力
for the benefit of residents|为了居民的利益
at the same time|与此同时
in line with expectations|符合预期地
as a result of consultation|作为磋商的结果
under current conditions|在当前条件下
to a considerable extent|在很大程度上
in the public interest|为了公共利益
with this objective in mind|考虑到这一目标
by comparison with earlier plans|与早期方案相比
in addition to existing measures|除现有措施之外
from an Australian perspective|从澳大利亚视角来看
at short notice|在临时通知的情况下
at the end of the day|归根结底
in the arvo|在下午
out in the bush|在澳洲内陆地区
across the country|在全国范围内
in everyday life|在日常生活中
`,
    sentencePatterns: [
      ["{subjectCapital} has introduced a comprehensive plan to improve access to essential services.", "{subjectChinese}推出了一项全面计划，以改善基本服务的获取机会。"],
      ["{subjectCapital} will evaluate the evidence before allocating additional resources.", "{subjectChinese}将在分配额外资源之前评估证据。"],
      ["{subjectCapital} is consulting local residents to ensure the proposal remains practical.", "{subjectChinese}正在征询当地居民意见，以确保该提案保持可行。"],
      ["{subjectCapital} has acknowledged that long-term investment is crucial for regional communities.", "{subjectChinese}已经承认长期投资对地区社区至关重要。"],
      ["{subjectCapital} must balance economic efficiency with environmental sustainability.", "{subjectChinese}必须平衡经济效率与环境可持续性。"]
    ]
  },
  {
    level: 2,
    nouns: `
anomaly|异常现象
aspiration|抱负、愿望
autonomy|自主权
coherence|连贯性
consensus|共识
contingency|意外情况、应急事项
contradiction|矛盾
correlation|相关性
deterioration|恶化
discrepancy|差异、不一致
discrimination|歧视、辨别
disruption|中断、扰乱
equilibrium|平衡状态
exploitation|利用、剥削
feasibility|可行性
fluctuation|波动
framework|框架
hierarchy|层级体系
hypothesis|假设
ideology|意识形态
inclination|倾向
infrastructure|基础设施
legitimacy|合法性、正当性
momentum|势头
negligence|疏忽
notion|观念
obligation|义务
paradox|悖论
parameter|参数、界限
prevalence|普遍存在
proficiency|熟练程度
rationale|基本原理、理由
reconciliation|和解、协调
reinforcement|强化
scrutiny|严格审查
speculation|推测
threshold|门槛、临界点
trajectory|发展轨迹
transparency|透明度
vulnerability|脆弱性
`,
    adjectives: `
arbitrary|任意的、武断的
autonomous|自主的
cohesive|有凝聚力的
compatible|兼容的、一致的
consecutive|连续的
contradictory|相互矛盾的
cumulative|累积的
detrimental|有害的
disproportionate|不成比例的
empirical|以实证为依据的
explicit|明确的
formidable|艰巨的、强大的
hypothetical|假设的
implicit|含蓄的、隐含的
indispensable|不可或缺的
inherent|固有的
legitimate|合法的、合理的
marginal|边缘的、微小的
mutual|相互的
negligible|微不足道的
prevalent|普遍的
profound|深远的
provisional|暂定的
reluctant|不情愿的
rigorous|严谨的
spontaneous|自发的
strategic|战略性的
tentative|试探性的、暂定的
transparent|透明的
vulnerable|脆弱的
`,
    verbs: `
alleviate|缓解
ascertain|查明
consolidate|巩固
contradict|反驳、与……矛盾
correlate|使相互关联
bolster|增强
discriminate|区分、歧视
disrupt|扰乱
exploit|利用
modulate|调节
formulate|制定
hinder|阻碍
hypothesise|提出假设
legitimise|使正当化
mitigate|减轻
perceive|察觉、理解
reconcile|协调、和解
refine|完善
fortify|巩固
scrutinise|仔细审查
speculate|推测
substantiate|证实
transcend|超越
undermine|削弱
validate|验证
`,
    adverbs: `
approximately|大约地
comparatively|相对而言
explicitly|明确地
inherently|本质上
reluctantly|不情愿地
`,
    verbObjects: `
pressure on low-income households|低收入家庭的压力
the cause of the discrepancy|差异的原因
the fragmented services|分散的服务
the earlier assumption|先前的假设
investment with regional growth|投资与地区增长
public confidence|公众信心
between short-term and structural effects|短期效应与结构性效应
essential transport networks|重要交通网络
underused public assets|未充分利用的公共资产
prices across the housing market|住房市场价格
a strategic response|战略性应对方案
regional development|地区发展
a plausible explanation|一个合理解释
the new regulatory model|新的监管模式
the environmental impact|环境影响
subtle changes in public opinion|公众意见的细微变化
competing community interests|相互竞争的社区利益
the analytical framework|分析框架
existing safeguards|现有保障措施
the financial assumptions|财务假设
about future demand|对未来需求作出推测
the central claim|核心主张
traditional boundaries|传统界限
institutional trust|制度信任
the research findings|研究结果
`,
    phraseMeanings: `
缓解低收入家庭的压力
查明差异产生的原因
整合分散的服务
反驳先前的假设
将投资与地区增长关联起来
增强公众信任
区分短期效应与结构性效应
扰乱重要交通网络
利用未充分使用的公共资产
调节住房市场价格
制定战略性应对方案
阻碍地区发展
提出一个合理的解释假设
使新的监管模式获得正当性
减轻环境影响
察觉公众意见的细微变化
协调相互竞争的社区利益
完善分析框架
巩固现有保障措施
仔细审查财务假设
推测未来需求
证实核心主张
超越传统界限
削弱制度信任
验证研究结果
`,
    starters: `
in light of recent evidence|鉴于最新证据
within the existing framework|在现有框架内
subject to further scrutiny|有待进一步审查
in the absence of consensus|在缺乏共识的情况下
with a degree of caution|带着一定程度的谨慎
from an institutional standpoint|从制度角度来看
in proportion to the risk|与风险成比例地
on the basis of feasibility|基于可行性
in anticipation of disruption|为预防中断
by means of targeted investment|通过有针对性的投资
in accordance with the guidelines|依照指导方针
with due regard for autonomy|在充分尊重自主权的情况下
beyond the immediate outcome|超越眼前结果
in contrast to prevailing assumptions|与普遍假设相反
as a matter of obligation|作为一项义务
at the threshold of change|处在变革的门槛上
under intense public scrutiny|在公众严格审视之下
without undermining legitimacy|在不削弱正当性的情况下
in pursuit of greater transparency|为了提高透明度
against a backdrop of uncertainty|在不确定性的背景下
to the best of our knowledge|据我们所知
in keeping with local priorities|符合当地优先事项地
on the strength of the evidence|凭借证据的支持
for the foreseeable future|在可预见的未来
with hindsight|事后看来
`,
    sentencePatterns: [
      ["Although {subject} initially underestimated the challenge, it has since adopted a more strategic approach.", "尽管{subjectChinese}最初低估了挑战，但它此后采取了更具战略性的方法。"],
      ["After reviewing the empirical evidence, {subject} concluded that the existing framework was inadequate.", "在审查实证证据后，{subjectChinese}得出结论，认为现有框架并不充分。"],
      ["{subjectCapital} is unlikely to maintain public confidence unless it addresses the discrepancy transparently.", "除非{subjectChinese}透明地处理这一差异，否则它不太可能维持公众信任。"],
      ["Not only has {subject} consolidated the available resources, but it has also established clear priorities.", "{subjectChinese}不仅整合了现有资源，还确立了明确的优先事项。"],
      ["{subjectCapital} remains committed to regional autonomy despite considerable institutional resistance.", "尽管存在相当大的制度阻力，{subjectChinese}仍致力于维护地区自主权。"]
    ]
  },
  {
    level: 3,
    nouns: `
assimilation|同化、吸收
causality|因果关系
cognition|认知
connotation|隐含意义
convergence|趋同、汇合
decentralisation|权力下放
dichotomy|二分法
discourse|话语、论述
disposition|倾向、性情
dissemination|传播
distortion|扭曲
doctrine|学说、原则
emancipation|解放
embodiment|体现、化身
fragmentation|碎片化
hegemony|霸权、主导地位
homogeneity|同质性
impartiality|公正
inference|推论
interdependence|相互依存
juxtaposition|并置、对照
manifestation|表现形式
methodology|方法论
paradigm|范式
polarisation|两极分化
predisposition|预先倾向
prerequisite|先决条件
reciprocity|互惠
redistribution|再分配
salience|显著性
segmentation|分割、细分
sovereignty|主权
synthesis|综合、合成
terminology|术语体系
transition|过渡
uniformity|一致性
validity|有效性
volatility|波动性
welfare|福祉
pluralism|多元主义
`,
    adjectives: `
equivocal|含糊的、立场不明的
analogous|相似的、可类比的
anomalous|反常的
asymmetrical|不对称的
causal|因果的
conceptual|概念性的
contextual|语境相关的
convergent|趋同的
decentralised|去中心化的
dichotomous|二分的
discursive|论述性的
divergent|分歧的、发散的
embedded|嵌入的
homogeneous|同质的
impartial|公正的
inferential|推论的
interdisciplinary|跨学科的
interdependent|相互依赖的
juxtaposed|并置的
methodological|方法论的
multidimensional|多维的
paradigmatic|范式性的
polarised|两极分化的
reciprocal|相互的、互惠的
salient|显著的
sovereign|拥有主权的
synthetic|综合的、合成的
transitional|过渡性的
uniform|一致的
volatile|不稳定的
`,
    verbs: `
assimilate|吸收、同化
conceptualise|概念化
converge|使趋同
decentralise|下放权力
delineate|清晰勾勒
disseminate|传播
distort|扭曲
embody|体现
emancipate|解放
fragment|使碎片化
infer|推断
juxtapose|并置对照
manifest|显现
mediate|调解、中介
polarise|使两极分化
predispose|使预先倾向
redistribute|重新分配
reframe|重新界定
segment|分割
synthesise|综合
differentiate|区分
integrate|整合
contextualise|置于语境中理解
articulate|清晰表达
pluralise|使多元化
`,
    adverbs: `
analytically|从分析角度
conceptually|从概念上
contextually|结合语境地
empirically|以实证方式
systematically|系统地
`,
    verbObjects: `
new evidence into the existing model|将新证据纳入现有模型
the relationship between identity and place|身份与地方之间的关系
divergent policy objectives|分歧的政策目标
decision-making authority|决策权
the boundary between public and private interests|公共与私人利益的界限
the findings across professional networks|通过专业网络传播研究结果
the representation of regional communities|地区社区的呈现方式
the principle of reciprocity|互惠原则
marginalised groups|边缘化群体
the service system|服务体系
a causal relationship from the data|从数据中推断因果关系
competing interpretations|相互竞争的解释
underlying social tensions|潜在社会张力
the dispute between institutions|机构之间的争议
public debate|公共讨论
communities towards particular outcomes|使社区倾向特定结果
resources across regions|各地区之间的资源
the issue as a question of welfare|将该问题重新界定为福祉问题
the population by access needs|按照获取需求细分人口
qualitative and quantitative evidence|综合定性和定量证据
between correlation and causality|区分相关与因果
the separate service networks|整合分散的服务网络
the findings within Australian history|将研究结果置于澳大利亚历史语境中
the central theoretical claim|清晰表达核心理论主张
the range of perspectives represented|使所呈现的视角更加多元
`,
    phraseMeanings: `
将新证据纳入现有模型
把身份与地方之间的关系概念化
使相互分歧的政策目标趋同
下放决策权
明确划定公共利益与私人利益的界限
通过专业网络传播研究结果
扭曲地区社区的呈现方式
体现互惠原则
解放边缘化群体
使服务体系碎片化
从数据中推断因果关系
并置相互竞争的解释
显现潜在的社会张力
调解机构之间的争议
使公共讨论两极分化
使社区倾向于特定结果
在不同地区之间重新分配资源
把该问题重新界定为福祉问题
按照获取需求细分人口
综合定性与定量证据
区分相关关系与因果关系
整合分散的服务网络
把研究结果置于澳大利亚历史语境中
清晰表达核心理论主张
使所呈现的视角更加多元
`,
    starters: `
at the conceptual level|在概念层面
within a broader social paradigm|在更广泛的社会范式中
through the lens of causality|透过因果关系的视角
in terms of methodological validity|就方法论有效性而言
against a history of decentralisation|在权力下放的历史背景下
across disciplinary boundaries|跨越学科边界
by inference rather than observation|通过推论而非观察
in a context of growing polarisation|在日益两极分化的语境中
with reciprocity as a guiding principle|以互惠为指导原则
at the intersection of welfare and sovereignty|在福祉与主权的交汇处
as an embodiment of institutional values|作为制度价值的体现
in opposition to a uniform model|与统一模式相对立
through systematic dissemination|通过系统传播
without reproducing existing distortions|在不复制现有扭曲的情况下
from a multidimensional perspective|从多维视角来看
as a prerequisite for meaningful reform|作为实质改革的先决条件
in the transition to a decentralised system|在向去中心化体系过渡期间
with particular methodological caution|带着特别的方法论谨慎
beyond a simple dichotomy|超越简单的二分法
in recognition of mutual interdependence|承认相互依存地
as the discourse continues to evolve|随着相关话语不断演变
in relation to cultural assimilation|关于文化同化
under conditions of market volatility|在市场波动的条件下
with the benefit of contextual evidence|借助语境证据
as competing paradigms converge|随着相互竞争的范式趋同
`,
    sentencePatterns: [
      ["What distinguishes {subject}'s approach is its capacity to integrate divergent perspectives without erasing their differences.", "{subjectChinese}的方法之所以与众不同，在于它能够整合不同视角而不抹去其差异。"],
      ["Having recognised the interdependence of regional services, {subject} has reframed the debate around collective welfare.", "在认识到地区服务的相互依存后，{subjectChinese}围绕集体福祉重新界定了讨论。"],
      ["The extent to which {subject} can decentralise decision-making will depend on the validity of its underlying assumptions.", "{subjectChinese}能够在多大程度上下放决策权，将取决于其基本假设的有效性。"],
      ["While critics maintain that the model encourages uniformity, {subject} contends that it supports genuine pluralism.", "尽管批评者认为该模型鼓励一致化，{subjectChinese}却主张它支持真正的多元主义。"],
      ["{subjectCapital} has contextualised the apparent contradiction by tracing its historical and institutional origins.", "{subjectChinese}通过追溯其历史和制度根源，将这一表面矛盾置于语境中加以理解。"]
    ]
  },
  {
    level: 4,
    nouns: `
ambivalence|矛盾心理
articulation|清晰表达、衔接
asymmetry|不对称性
commensurability|可通约性
conjecture|推测、猜想
dialectic|辩证关系
differentiation|差异化
dissonance|不协调、认知失调
elucidation|阐明
entrenchment|根深蒂固
essentialism|本质主义
extrapolation|外推法
fallacy|谬误
genealogy|谱系、起源脉络
heterogeneity|异质性
incommensurability|不可通约性
institutionalisation|制度化
intersectionality|交叉性
irreversibility|不可逆性
materiality|物质性、重要性
normativity|规范性
ontology|本体论
orthodoxy|正统观念
permeability|渗透性
positionality|立场性
presupposition|预设
reductionism|还原论
reflexivity|反思性
relativism|相对主义
representation|再现、代表
rhetoric|修辞、言辞
subjectivity|主观性
superstructure|上层结构
teleology|目的论
transience|短暂性
triangulation|三角验证
universality|普遍性
verisimilitude|逼真性
viability|可行性、生命力
liminality|阈限状态
`,
    adjectives: `
ambivalent|矛盾的
asymmetric|不对称的
commensurable|可通约的
conjectural|推测性的
dialectical|辩证的
differentiated|差异化的
dissonant|不协调的
entrenched|根深蒂固的
essentialist|本质主义的
extrapolative|外推的
fallacious|谬误的
genealogical|谱系学的
heterogeneous|异质的
incommensurable|不可通约的
institutionalised|制度化的
intersectional|交叉性的
irreversible|不可逆的
material|实质性的、物质的
normative|规范性的
ontological|本体论的
orthodox|正统的
permeable|可渗透的
positional|与立场相关的
reductionist|还原论的
reflexive|反思性的
relativistic|相对主义的
rhetorical|修辞性的
subjective|主观的
transient|短暂的
universal|普遍的
`,
    verbs: `
expound|详尽阐述
postulate|假定、提出
demarcate|划定、区分
elucidate|阐明
entrench|使根深蒂固
extrapolate|外推
institutionalise|使制度化
interrogate|批判性审视
problematise|将……作为问题审视
reconstitute|重新构成
reconceptualise|重新概念化
recontextualise|重新置于语境
corroborate|佐证
triangulate|三角验证
universalise|使普遍化
destabilise|使不稳定
deconstruct|解构
foreground|突出
marginalise|使边缘化
operationalise|使可操作化
harmonise|协调
render|使成为
situate|将……置于特定背景
theorise|理论化
qualify|限定、修正
`,
    adverbs: `
dialectically|以辩证方式
genealogically|从谱系角度
normatively|从规范角度
reflexively|反思性地
rhetorically|从修辞上
`,
    verbObjects: `
the relationship between materiality and representation|物质性与再现之间的关系
an alternative institutional trajectory|另一种制度发展轨迹
between normative and empirical claims|区分规范性与实证性主张
the presuppositions of the orthodox model|阐明正统模型的预设
existing power asymmetries|使现有权力不对称根深蒂固
long-term outcomes from limited evidence|从有限证据外推长期结果
temporary administrative practices|使临时行政实践制度化
the rhetoric of universality|批判性审视普遍性修辞
the assumption of cultural homogeneity|将文化同质性的假设作为问题审视
the fragmented policy field|重新构成碎片化的政策领域
community resilience as a relational process|将社区韧性重新概念化为关系过程
the debate within its colonial history|将讨论重新置于殖民历史语境
the conjectural interpretation|证实推测性的解释
evidence from three independent sources|用三个独立来源的证据进行三角验证
a historically specific experience|将历史特定经验普遍化
the apparent stability of the framework|动摇框架表面的稳定性
the binary opposition|解构二元对立
the role of institutional power|突出制度权力的作用
alternative forms of knowledge|使其他知识形式边缘化
the concept of reflexivity|使反思性概念可操作化
apparently incommensurable positions|调和表面上不可通约的立场
the distinction politically significant|使这种区分具有政治意义
the analysis within a normative framework|将分析置于规范框架中
the relationship between rhetoric and legitimacy|将修辞与正当性的关系理论化
the claim without abandoning it entirely|限定该主张而不完全放弃它
`,
    phraseMeanings: `
详尽阐述物质性与再现之间的关系
提出另一种制度发展轨迹的假设
划定规范性主张与实证性主张的界限
阐明正统模型的预设
使现有的权力不对称根深蒂固
从有限证据外推长期结果
使临时行政实践制度化
批判性审视普遍性修辞
将文化同质性的假设作为问题审视
重新构成碎片化的政策领域
将社区韧性重新概念化为一种关系过程
把讨论重新置于殖民历史语境
以证据佐证推测性的解释
用三个独立来源的证据进行三角验证
将历史特定经验普遍化
动摇框架表面上的稳定性
解构二元对立
突出制度权力的作用
使其他知识形式边缘化
使反思性概念具有可操作性
协调表面上不可通约的立场
使这种区分具有政治意义
将分析置于规范框架中
把修辞与正当性的关系理论化
限定该主张而不完全放弃它
`,
    starters: `
from a reflexive standpoint|从反思性立场来看
within an ontological framework|在本体论框架内
through a genealogical analysis|通过谱系分析
at the level of normative theory|在规范理论层面
without resorting to reductionism|在不诉诸还原论的情况下
in recognition of positionality|在承认立场性的前提下
across seemingly incommensurable paradigms|跨越看似不可通约的范式
as an expression of institutionalised power|作为制度化权力的表现
at the intersection of materiality and discourse|在物质性与话语的交汇处
with an emphasis on methodological reflexivity|强调方法论反思性地
beyond the rhetoric of universality|超越普遍性修辞
under conditions of structural asymmetry|在结构性不对称条件下
by way of theoretical extrapolation|通过理论外推
in opposition to essentialist accounts|与本质主义解释相对立
as a consequence of discursive entrenchment|作为话语固化的结果
within a liminal institutional space|在阈限性的制度空间内
from the perspective of intersectionality|从交叉性视角来看
insofar as the categories remain permeable|只要这些类别仍具有渗透性
subject to ontological qualification|有待本体论层面的限定
through the triangulation of heterogeneous evidence|通过对异质证据进行三角验证
without presupposing historical inevitability|在不预设历史必然性的情况下
in the interests of analytical commensurability|为了分析上的可通约性
as orthodoxy gives way to conjecture|随着正统观念让位于推测
amid persistent rhetorical dissonance|在持续的修辞不协调中
at the boundary between subjectivity and representation|在主观性与再现的边界上
`,
    sentencePatterns: [
      ["Were {subject} to universalise this historically specific experience, the analysis would reproduce the very asymmetry it seeks to challenge.", "如果{subjectChinese}把这一历史特定经验普遍化，其分析就会重现它试图挑战的那种不对称。"],
      ["Only by interrogating its own positionality can {subject} avoid entrenching an ostensibly neutral orthodoxy.", "只有批判性审视自身立场，{subjectChinese}才能避免固化一种表面中立的正统观念。"],
      ["{subjectCapital}'s presupposition that the categories are commensurable overlooks their distinct ontological foundations.", "{subjectChinese}预设这些类别可以通约，却忽略了它们不同的本体论基础。"],
      ["Far from resolving the dialectical tension, {subject}'s intervention has rendered its normative dimensions more visible.", "{subjectChinese}的干预非但没有解决辩证张力，反而使其规范性维度更加明显。"],
      ["Whether {subject} can operationalise reflexivity hinges not merely on methodology but also on institutional viability.", "{subjectChinese}能否使反思性具有可操作性，不仅取决于方法论，也取决于制度可行性。"]
    ]
  },
  {
    level: 5,
    nouns: `
aporia|理论难题、无解矛盾
axiology|价值论
casuistry|诡辩、案例伦理学
circumlocution|迂回表达
consilience|多领域证据的融贯
deontology|义务论
determinism|决定论
doxography|学说史编纂
elision|省略、消隐
entailment|蕴涵关系
epiphenomenon|附带现象
hermeneutics|解释学
historicity|历史性
immanence|内在性
indeterminacy|不确定性
ineffability|不可言说性
intersubjectivity|主体间性
metanarrative|宏大叙事
mereology|部分与整体理论
nominalism|唯名论
phenomenology|现象学
polysemy|一词多义
poststructuralism|后结构主义
praxis|实践活动
prolepsis|预叙、预先反驳
reification|物化
semiotics|符号学
simulacrum|拟像
solipsism|唯我论
synecdoche|提喻
tautology|同义反复
transcendence|超越性
underdetermination|证据不充分决定
univocity|单义性
weltanschauung|世界观
alterity|他者性
apodicticity|必然确实性
discursivity|话语性
performativity|施为性
teleonomy|表面目的性
`,
    adjectives: `
axiological|价值论的
casuistic|诡辩式的、案例伦理的
deontological|义务论的
deterministic|决定论的
doxographic|学说史编纂的
elliptical|省略的、晦涩的
epiphenomenal|附带现象的
hermeneutic|解释学的
immanent|内在的
indeterminate|不确定的
ineffable|不可言说的
intersubjective|主体间的
metatheoretical|元理论的
mereological|部分整体论的
nominalist|唯名论的
phenomenological|现象学的
polysemous|多义的
poststructuralist|后结构主义的
proleptic|预叙的、预先的
reified|被物化的
semiotic|符号学的
simulacral|拟像的
solipsistic|唯我论的
tautological|同义反复的
transcendent|超越的
underdetermined|证据无法充分决定的
univocal|单义的
apodictic|无可争辩的
aleatory|偶然性的
performative|施为性的
`,
    verbs: `
adumbrate|勾勒、预示
apotheosise|神化
circumscribe|限定范围
disambiguate|消除歧义
elide|省略、消隐
instantiate|实例化
interpellate|召唤为特定主体
reify|物化
recapitulate|概括重述
explicate|详尽阐释
imbricate|使重叠交织
hypostatise|把抽象概念实体化
demystify|去神秘化
deterritorialise|去疆域化
reterritorialise|再疆域化
essentialise|本质化
totalise|总体化
sublate|辩证扬弃
overdetermine|多重决定
underdetermine|未充分决定
prefigure|预示
presuppose|预设
rearticulate|重新表述、联结
transvaluate|重新评价价值
contest|质疑
`,
    adverbs: `
axiomatically|作为公理地
hermeneutically|以解释学方式
ontologically|从本体论上
semiotically|从符号学角度
teleologically|以目的论方式
`,
    verbObjects: `
the contours of an alternative axiology|勾勒另一种价值论的轮廓
the canonical interpretation|神化经典解释
the domain of legitimate inquiry|限定合法研究的范围
the polysemous term|消除该多义术语的歧义
the historical conditions of the concept|消隐该概念的历史条件
the abstract principle in a concrete case|在具体案例中实例化抽象原则
citizens as governable subjects|将公民召唤为可治理主体
the contingent social relation|物化偶然的社会关系
the argument without resolving its aporia|概括重述论点但不解决其理论难题
the hermeneutic implications|详尽阐释其解释学含义
material and semiotic processes|使物质与符号过程相互交织
institutional legitimacy|把制度正当性实体化
the apparent inevitability of the metanarrative|消解宏大叙事表面的必然性
the established field of meaning|使既定意义场域去疆域化
the discourse within a new institutional order|在新制度秩序中重构话语疆域
cultural alterity|将文化他者性本质化
the plurality of lived experience|将生活经验的多样性总体化
the opposition between immanence and transcendence|辩证扬弃内在性与超越性的对立
the outcome through multiple causal logics|通过多重因果逻辑决定结果
the theory with the available evidence|使现有证据不足以决定理论
the subsequent epistemic shift|预示随后的认识论转变
a univocal relationship between sign and meaning|预设符号与意义之间的单义关系
the claim through a deontological vocabulary|用义务论词汇重新表述该主张
the inherited hierarchy of values|重新评价继承而来的价值层级
the distinction between praxis and representation|将实践与再现的区分问题化
`,
    phraseMeanings: `
勾勒另一种价值论的轮廓
神化经典解释
限定合法研究的范围
消除多义术语的歧义
消隐该概念的历史条件
在具体案例中实例化抽象原则
将公民召唤为可治理的主体
把偶然的社会关系物化
概括重述论点而不解决其理论难题
详尽阐释其解释学含义
使物质过程与符号过程相互交织
把制度正当性实体化
消解宏大叙事表面的必然性
使既定的意义场域去疆域化
在新的制度秩序中重构话语疆域
将文化他者性本质化
把生活经验的多样性总体化
辩证扬弃内在性与超越性的对立
通过多重因果逻辑决定结果
使现有证据不足以决定理论
预示随后的认识论转变
预设符号与意义之间的单义关系
用义务论词汇重新表述该主张
重新评价继承而来的价值层级
质疑实践与再现之间的区分
`,
    starters: `
at the limits of hermeneutic intelligibility|在解释学可理解性的边界上
within a deontological account of obligation|在义务论的责任解释中
as an instance of semiotic overdetermination|作为符号学多重决定的实例
beyond the aporia of representation|超越再现的理论难题
through an axiological transvaluation|通过价值论上的重新评价
without hypostatising social categories|在不把社会类别实体化的情况下
insofar as meaning remains polysemous|只要意义仍然具有多义性
at the juncture of immanence and transcendence|在内在性与超越性的交界处
as a performative rather than descriptive act|作为施为行为而非描述行为
under conditions of epistemic indeterminacy|在认识论不确定性条件下
from a poststructuralist vantage point|从后结构主义视角来看
within the phenomenology of everyday praxis|在日常实践的现象学中
as the metanarrative begins to unravel|随着宏大叙事开始瓦解
through the elision of historical alterity|通过消隐历史他者性
without presupposing nominalist ontology|在不预设唯名论本体论的情况下
as an epiphenomenon of institutional change|作为制度变迁的附带现象
in a relation of intersubjective recognition|在主体间承认关系中
beyond the simulacrum of public consensus|超越公众共识的拟像
by means of proleptic critique|通过预先性的批判
in the absence of apodictic certainty|在缺乏无可争辩的确定性时
as praxis displaces abstract casuistry|随着实践取代抽象诡辩
within a mereology of institutional power|在制度权力的部分整体论中
through the reification of contingent norms|通过将偶然规范物化
despite the ineffability of lived experience|尽管生活经验不可言说
at the point where teleonomy resembles design|在表面目的性类似设计之处
`,
    sentencePatterns: [
      ["Had it not been for {subject}'s elision of historical alterity, the metanarrative might never have acquired its apparent coherence.", "若非{subjectChinese}消隐了历史他者性，这一宏大叙事或许永远不会获得其表面的连贯性。"],
      ["What appears at first to be {subject}'s apodictic claim is, on closer examination, underdetermined by the available evidence.", "{subjectChinese}的主张乍看之下无可争辩，但仔细审视后会发现，现有证据并不足以决定它。"],
      ["Notwithstanding the ostensible univocity of its terminology, {subject}'s discourse remains irreducibly polysemous.", "尽管其术语表面上具有单义性，{subjectChinese}的话语仍然不可还原地保持多义。"],
      ["The proposition advanced by {subject} presupposes a deontological framework that its own axiological commitments cannot sustain.", "{subjectChinese}提出的命题预设了一个义务论框架，而其自身的价值论承诺无法支撑该框架。"],
      ["To characterise {subject}'s intervention as merely performative would be to disregard the material praxis through which it is instantiated.", "若把{subjectChinese}的干预仅仅描述为施为性的，就会忽略使其得以实例化的物质实践。"]
    ]
  }
];

function parseRows(text) {
  const rows = [];
  const lines = text.trim().split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    const parts = lines[index].split("|");
    rows.push({ english: parts[0].trim(), chinese: parts[1].trim() });
  }
  return rows;
}

function parseValues(text) {
  const values = [];
  const lines = text.trim().split("\n");
  for (let index = 0; index < lines.length; index += 1) {
    values.push(lines[index].trim());
  }
  return values;
}

function addWordEntries(entries, config, rows, wordKind) {
  const parsedRows = parseRows(rows);
  for (let index = 0; index < parsedRows.length; index += 1) {
    const row = parsedRows[index];
    let example;
    if (wordKind === "adjective") {
      example = `After reviewing the evidence, the panel described the proposal as ${row.english}.`;
    } else if (wordKind === "verb") {
      const objects = parseRows(config.verbObjects);
      example = `The case study examines how institutions ${row.english} ${objects[index].english}.`;
    } else if (wordKind === "adverb") {
      example = `The council responded ${row.english} when conditions changed across the region.`;
    } else {
      example = `The public lecture examined ${row.english} in the context of contemporary Australia.`;
    }
    entries.push(createEntry(config.level, "word", row.english, row.chinese, example));
  }
}

function createPhraseEntries(entries, config) {
  const verbs = parseRows(config.verbs);
  const objects = parseRows(config.verbObjects);
  const phraseMeanings = parseValues(config.phraseMeanings);
  if (phraseMeanings.length !== verbs.length) {
    throw new Error(`Level ${config.level} 的动词词组释义数量不匹配`);
  }
  for (let index = 0; index < verbs.length; index += 1) {
    const termContent = `${verbs[index].english} ${objects[index].english}`;
    const meaning = phraseMeanings[index];
    const example = `The case study shows how institutional decisions can ${termContent}.`;
    entries.push(createEntry(config.level, "phrase", termContent, meaning, example));
  }

  const starters = parseRows(config.starters);
  for (let index = 0; index < starters.length; index += 1) {
    const capitalisedStarter = capitalise(starters[index].english);
    const example = `${capitalisedStarter}, the committee adjusted its approach to the proposal.`;
    entries.push(createEntry(
      config.level,
      "phrase",
      starters[index].english,
      starters[index].chinese,
      example
    ));
  }
}

function createSentenceEntries(entries, config) {
  for (let subjectIndex = 0; subjectIndex < subjects.length; subjectIndex += 1) {
    const subject = subjects[subjectIndex];
    for (let patternIndex = 0; patternIndex < config.sentencePatterns.length; patternIndex += 1) {
      const pattern = config.sentencePatterns[patternIndex];
      const termContent = fillPattern(pattern[0], subject);
      const meaning = fillPattern(pattern[1], subject);
      const example = `In an Australian policy discussion: “${termContent}”`;
      entries.push(createEntry(config.level, "sentence", termContent, meaning, example));
    }
  }
}

function fillPattern(pattern, subject) {
  return pattern
    .replaceAll("{subjectCapital}", capitalise(subject.english))
    .replaceAll("{subjectChinese}", subject.chinese)
    .replaceAll("{subject}", subject.english);
}

function capitalise(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function createEntry(level, termType, termContent, meaning, example) {
  return { example, level, meaning, termContent, termType };
}

function buildEntries() {
  const entries = [];
  for (let index = 0; index < levelConfigs.length; index += 1) {
    const config = levelConfigs[index];
    const levelEntries = [];
    addWordEntries(levelEntries, config, config.nouns, "noun");
    addWordEntries(levelEntries, config, config.adjectives, "adjective");
    addWordEntries(levelEntries, config, config.verbs, "verb");
    addWordEntries(levelEntries, config, config.adverbs, "adverb");
    createPhraseEntries(levelEntries, config);
    createSentenceEntries(levelEntries, config);

    if (levelEntries.length !== 200) {
      throw new Error(`Level ${config.level} 应生成 200 条，实际生成 ${levelEntries.length} 条`);
    }

    for (let entryIndex = 0; entryIndex < levelEntries.length; entryIndex += 1) {
      entries.push(levelEntries[entryIndex]);
    }
  }
  return entries;
}

async function insertEntries(entries) {
  let insertedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  await database.run("BEGIN IMMEDIATE");
  try {
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const existing = await database.get(
        `SELECT id, meaning, example FROM aussieTerms
         WHERE level = ? AND termType = ? AND termContent = ?`,
        [entry.level, entry.termType, entry.termContent]
      );
      if (existing) {
        if (existing.meaning !== entry.meaning || existing.example !== entry.example) {
          await database.run(
            `UPDATE aussieTerms SET meaning = ?, example = ? WHERE id = ?`,
            [entry.meaning, entry.example, existing.id]
          );
          updatedCount += 1;
        } else {
          skippedCount += 1;
        }
        continue;
      }

      await database.run(
        `INSERT INTO aussieTerms (termContent, meaning, example, termType, level)
         VALUES (?, ?, ?, ?, ?)`,
        [entry.termContent, entry.meaning, entry.example, entry.termType, entry.level]
      );
      insertedCount += 1;
    }
    await database.run("COMMIT");
  } catch (error) {
    await database.run("ROLLBACK");
    throw error;
  }
  return { insertedCount, skippedCount, updatedCount };
}

async function seedLearningData() {
  await database.initializeDatabase();
  const entries = buildEntries();
  const result = await insertEntries(entries);
  console.log(
    `种子数据完成：新增 ${result.insertedCount} 条，更新 ${result.updatedCount} 条，跳过 ${result.skippedCount} 条。`
  );
  await database.close();
}

seedLearningData().catch(async (error) => {
  console.error("种子数据写入失败", error);
  try {
    await database.close();
  } catch (closeError) {
    console.error("数据库关闭失败", closeError);
  }
  process.exitCode = 1;
});
