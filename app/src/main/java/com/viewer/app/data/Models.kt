package com.viewer.app.data

data class FeedItem(
    val id: String,
    val type: FeedItemType,
    val title: String,
    val subtitle: String? = null,
    val authorName: String? = null,
    val authorImage: String? = null,
    val thumbnail: String? = null,
    val timestamp: String? = null,
    val votes: String? = null,
    val comments: Int? = null,
    val category: String? = null,
    val excerpt: String? = null,
    val videoDuration: String? = null
)

enum class FeedItemType {
    NEWS, VIDEO, BLOG, PROMO
}

object SampleData {
    val feedItems = listOf(
        FeedItem(
            id = "1",
            type = FeedItemType.NEWS,
            title = "Global Tech Summit 2024: AI Regulation Takes Center Stage",
            category = "Breaking News",
            timestamp = "2h ago",
            votes = "12.4k",
            comments = 842,
            thumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuDDxaSaviRM8BtuVImE3qUKdiC0yfyq1h01xFMcryTvMKZLQKCanBHPBVhsRX53NZgHXc6H1BAAfJ5KQakm6UlX7j5w_VdquSsphBZKxcgh7Dbs0zaiOrXfSE16G2SBFvEyErIjDsVnE64Sehh2-mINlJjLGUzYlNMho5GpkKGmhXw4tYPBfc4R3tRjg-ZW9bi6XmbWliE_4e3KhyOszJzF-gza14Pplh0IorBQkHeylVninGydwjYLQ_XPlgoi8Ap3NhkeyYDLbJfc"
        ),
        FeedItem(
            id = "2",
            type = FeedItemType.VIDEO,
            title = "The Future of Minimalist UI Design: Trends for 2025",
            subtitle = "Design Insider • 458k views • 1 day ago",
            authorName = "Design Insider",
            authorImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuDAopBRY6ijsAKZORCF7EklqIRL1BD4G5MdVEf_sdSpKtsL8YMiDEkQNGqMWykYHmSF_u2WnQPflfk46IT9plwZ0o7Wi8AOI36dTmLGfAfIB7n_oB_Qpbl34uoAmgbKsaWgd9lo0plZ26kSXt7MLA707yvhmpy9BePXUQBSfG_4ppJmuodjRrgmv6k10NSWrVa97o9vC3YDm4A66LTVO-tCgvG5vbrDpnVJSjs1zezyiaNjySkb4rpVNkGsf7DfqjV7u5hDYhbUzsdM",
            thumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuBK2jFvIsnmaW1R3KrYGmPsp4nXywhmtdTVhbT_UU6S8pIDXWpcQr3nGvuz9JMrMNUcUuaj3k_zXwSCsj_YV35sgIGOP3xkRv9antEeS5g47dFJKbOlE0JoBIHw5j6l5S9O-4EkuQhZTCa-ja276H-PeC4H7Hp8mWg9-lIpsPVoBCVaR_uhgY9_Dv32QIvvNwd-tSgPRRIknt4UPumtgqa7pLRRUGCaRdV-zvtvo7uhibziwZKy9g1TBo5O0SChYUSoumbMNBPMl5g0",
            videoDuration = "14:22"
        ),
        FeedItem(
            id = "3",
            type = FeedItemType.BLOG,
            title = "Exploring the intersection of form and function in modern apps.",
            excerpt = "Minimalism isn't just about white space anymore. It's about reducing cognitive load through intelligent motion and contextual layouts...",
            authorName = "Jane Doe",
            subtitle = "in Design Matters",
            authorImage = "https://lh3.googleusercontent.com/aida-public/AB6AXuBb-o9NdcF70jNcEQ3X2H_XUtZa4RnVthLcJWwq3gKgt0ByjZTXV6MMnYJhpbu8wCusPeMy1n3pJFMt1T5dTLBtIyRUtRZmj4K1LHJDMmv2DaWsCxMpNsi8BzyfvH2plhtcG3n4DOWA24S-9q2-B-tiEKyS_ONNzXkSgzM98ClQFyeJn5Oq3kW9jsMzZtCHz1jfRUyLK_YdNe0QorRE1GbZrE46dy9bcu3fZWDwhEEZe4KKTpF0Lh9ZU3pRrY_eIUZKVvJ_ebX2dDvc",
            votes = "1.2k",
            comments = 42
        ),
        FeedItem(
            id = "4",
            type = FeedItemType.PROMO,
            title = "Stay Updated",
            subtitle = "Get the best stories delivered to your inbox every morning."
        ),
        FeedItem(
            id = "5",
            type = FeedItemType.NEWS,
            title = "Global Markets Rally Amid Economic Optimism and New Trade Deals",
            category = "Economy",
            timestamp = "4h ago",
            votes = "3.1k",
            comments = 156,
            thumbnail = "https://lh3.googleusercontent.com/aida-public/AB6AXuCZAoyLSLU_gBYxJ3MlUXM6QwsmEhYIUfR3xOQ6Hbl-r-zsglhDTqLznDgJnEsKTSYF_AIjnAln1PPfBGlMeGEoYKSyaesCIuAhZF9v-Q_q6xmA0kqHT8UHA-FS5IiYfsKooyx4v3wJcecgJS5TTRqHPC9X0krkvVNcPbat8QsdlMMHcSMQw0G4_46xvbcIPpWuM7YG_nrgddbcMIMZqHu0RmZGt1UQeUg-uWv9gCVYr5iiWchyNvalQgBc1yLpFLLogPfis0Hrw2J5"
        )
    )
}
