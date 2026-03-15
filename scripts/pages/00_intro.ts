/**
 * 导读 · 欢迎使用
 */
import { h1, h2, paragraph, textElement, boldElement, bullet, ordered, divider, quote, type Page } from './blocks';

export const page: Page = {
  title: '导读 · 欢迎使用',
  blocks: [
    h1('商科面试三步法'),
    paragraph(
      textElement('如果你有过这种感觉——面试前准备了很多，进去之后却发现自己说的话好像都没说到点上——那这套东西可能正是你需要的。')
    ),
    paragraph(
      textElement('商科面试失败，大多数情况不是经历不够好，也不是不够聪明。'),
      boldElement('真正的问题是：不知道面试在考什么。'),
      textElement('准备方向错了，再努力也是白费。')
    ),
    divider(),

    h2('这套方法帮你做三件事'),
    bullet(boldElement('看懂'), textElement(' — 从任何一份JD里，提炼出它真正考察的能力')),
    bullet(boldElement('找到'), textElement(' — 从你自己的经历里，找到能证明这些能力的素材')),
    bullet(boldElement('说清楚'), textElement(' — 在行为面、Case面、简历三种场景，都能说到点上')),
    paragraph(
      textElement('说白了就是一句话：'),
      boldElement('先搞清楚考什么，再去准备怎么答。')
    ),
    divider(),

    h2('知识库结构'),
    ordered(boldElement('Part 1：认知破局'), textElement(' — 面试到底在考什么？为什么背题没用？先把认知对准')),
    ordered(boldElement('Part 2：三步法框架'), textElement(' — 核心方法：拆JD → 对能力 → 三类表达（行为/Case/简历）')),
    ordered(boldElement('Part 4：高频题应用'), textElement(' — 把三步法用在最常考的题型上，直接上手练')),
    divider(),

    h2('怎么用'),
    ordered(textElement('先读 Part 1，把备考的底层逻辑想通（10分钟就够）')),
    ordered(textElement('拿到你的目标JD，跟着 Part 2 走一遍三步法')),
    ordered(textElement('根据面试类型，进 Step 3 对应章节深入练')),
    ordered(textElement('用 Part 4 的高频题做最终检验，查漏补缺')),
    divider(),

    quote(
      boldElement('记住这句话：'),
      textElement('所有面试题，本质上只是在用不同方式考你同一套能力。想通了这个，准备面试就不慌了。')
    ),
  ],
};
