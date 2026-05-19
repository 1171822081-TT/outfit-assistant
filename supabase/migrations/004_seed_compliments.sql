-- 穿搭助手 夸赞种子数据
-- Phase 1.7: ≥ 40 条夸赞，覆盖 6 种穿搭标签 × 4 种性格
-- tags: 穿搭标签 (casual/office/sport/sweet/cool/gentle 的中文对应)
-- personality_tags: 适合的性格 (outgoing/introverted/confident/gentle)

INSERT INTO compliments (text, tags, personality_tags, is_fallback) VALUES
-- ===== 休闲自在 (casual) =====
('今天的慵懒感拿捏得刚刚好，松弛又好看～', '{casual}', '{outgoing,confident}', false),
('把基础款穿出了不简单的感觉！', '{casual}', '{outgoing,introverted,confident,gentle}', false),
('这身好舒服的样子，看着就想和你一起喝杯咖啡', '{casual}', '{gentle,introverted}', false),
('舒适又时髦，这就是你的日常魔法吧', '{casual}', '{outgoing,confident}', false),
('简简单单就很好看，气质这块你从来没输过', '{casual}', '{gentle,confident}', false),
('随手一搭就这么好看，这也太让人羡慕了', '{casual}', '{outgoing,confident}', false),
('松弛感满分，今天的你看起来特别自在', '{casual}', '{introverted,gentle}', false),

-- ===== 通勤干练 (office) =====
('走路带风，职场最亮眼的存在！', '{office}', '{outgoing,confident}', false),
('干练又不失细节，这身见客户稳了', '{office}', '{confident}', false),
('专业感和品味同时在线的搭配', '{office}', '{confident,introverted}', false),
('一看就是靠谱的人，今天也要加油哦', '{office}', '{gentle,introverted}', false),
('这件单品选得太妙了，通勤也能穿出态度', '{office}', '{outgoing,confident}', false),
('利落又精神，会议室里最亮眼的就是你', '{office}', '{outgoing,confident}', false),
('简约不简单，气质这块狠狠拿捏', '{office}', '{gentle,confident}', false),

-- ===== 运动活力 (sport) =====
('元气满满！一看就是要去挥洒汗水的节奏', '{sport}', '{outgoing}', false),
('活力感要溢出屏幕了，今天运动量肯定达标', '{sport}', '{outgoing,confident}', false),
('运动风也能穿得这么好看，不愧是你', '{sport}', '{outgoing,confident,gentle}', false),
('状态超好，今天的你充满了能量', '{sport}', '{outgoing,confident}', false),
('这一身动感十足，看着就想出去跑两圈', '{sport}', '{outgoing}', false),
('运动装备都选得这么有眼光，穿搭功底藏不住', '{sport}', '{confident,gentle}', false),

-- ===== 甜美可爱 (sweet) =====
('今天的甜度超标啦！笑容和穿搭都满分', '{sweet}', '{outgoing,gentle}', false),
('这也太可爱了吧，走在街上回头率肯定高', '{sweet}', '{outgoing,gentle}', false),
('甜甜的像是从画报里走出来的', '{sweet}', '{gentle}', false),
('少女感拉满！今天的你闪闪发光', '{sweet}', '{outgoing,gentle}', false),
('甜美又不会太过，分寸感掌握得刚刚好', '{sweet}', '{gentle,introverted}', false),
('看见你的穿搭，心情都变好了', '{sweet}', '{outgoing,gentle}', false),

-- ===== 酷飒帅气 (cool) =====
('气场两米八！今天谁都别想拦住你', '{cool}', '{outgoing,confident}', false),
('这也太飒了吧，走路都带BGM的感觉', '{cool}', '{outgoing,confident}', false),
('酷酷的气质配上这身简直绝了', '{cool}', '{confident}', false),
('今天这身太有态度了，个性满分', '{cool}', '{outgoing,confident}', false),
('不费力的时髦感，又酷又松弛', '{cool}', '{confident,introverted}', false),
('暗黑系的你简直不要太迷人', '{cool}', '{confident,gentle}', false),

-- ===== 温柔气质 (gentle) =====
('温柔得让人移不开眼，今天的搭配绝了', '{gentle}', '{gentle,introverted}', false),
('气质这块你永远可以相信，温婉又大方', '{gentle}', '{gentle,confident}', false),
('这一身好有质感，像是文艺电影里走出来的人', '{gentle}', '{gentle,introverted}', false),
('优雅不费力，这就是天生的好品味吧', '{gentle}', '{gentle,confident}', false),
('细节里都是温柔，这样的穿搭太治愈了', '{gentle}', '{gentle,introverted}', false),
('温润如玉说得就是你今天这样吧', '{gentle}', '{gentle,confident}', false),
('安静的温柔里藏着一股力量，很好看', '{gentle}', '{gentle,introverted,confident}', false),

-- ===== 通用鼓励语 (fallback，无特定标签) =====
('今天也是认真对待穿搭的一天呢！', '{casual}', '{outgoing,introverted,confident,gentle}', true),
('穿搭不只是衣服，是你今天的心情表达', '{casual}', '{outgoing,introverted,confident,gentle}', true),
('每天都在用穿搭书写自己的故事，真棒', '{office}', '{outgoing,introverted,confident,gentle}', true),
('你的衣柜里藏着最好的自己', '{gentle}', '{outgoing,introverted,confident,gentle}', true),
('期待你的第一件衣服哦～从零开始也很酷', '{casual}', '{outgoing,introverted,confident,gentle}', true),
('每一天都是新风格的开始，大胆尝试吧', '{sport}', '{outgoing,introverted,confident,gentle}', true);
