package com.viewer.app.data

import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow

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
    val excerpt: String? = "A detailed look into the recent developments, exploring the potential impacts, challenges, and long-term implications for stakeholders.",
    val videoDuration: String? = null,
    val content: String? = "In a significant development that has sparked widespread discussions, stakeholders have recognized the necessity for comprehensive reforms. The changing dynamics of the global landscape demand a proactive and adaptive approach from all sectors involved.\n\nAnalysts point out that the implementation of these new frameworks will likely face initial hurdles, particularly concerning resource allocation and logistical alignment. However, the long-term projections suggest a robust strengthening of the core infrastructure, paving the way for unprecedented growth and stability.\n\nAs public discourse continues to evolve, it remains crucial for policymakers to maintain transparency and foster inclusive dialogues. Ensuring that diverse perspectives are considered will be key to navigating the complexities of this transition and achieving sustainable success.",
    val quote: String? = "Adaptability and transparency are the twin pillars of enduring progress in any systemic transition.",
    val isTrending: Boolean = false
)

enum class FeedItemType {
    FORUM, POLICY_TYPE, DEBATE, UPDATE, NEWS, BLOG, VIDEO, PROMO
}

object SampleData {
    val topNarratives = listOf(
        FeedItem(
            id = "tn1",
            type = FeedItemType.POLICY_TYPE,
            title = "BJP outlines vision for Viksit Bharat by 2047",
            category = "Policy",
            thumbnail = "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800"
        ),
        FeedItem(
            id = "tn2",
            type = FeedItemType.UPDATE,
            title = "Digital India Revolution: Bridging the Rural-Urban Divide",
            category = "Digital India",
            thumbnail = "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800"
        )
    )

    private val baseFeedItems = listOf(
        // Politics
        FeedItem(id = "p1", type = FeedItemType.FORUM, title = "Supreme Court delivers landmark verdict on electoral bonds, mandates immediate disclosure", category = "Politics", timestamp = "2h ago", votes = "24.5k", comments = 3204, thumbnail = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", authorName = "The Hindu Analysis"),
        FeedItem(id = "p2", type = FeedItemType.DEBATE, title = "Ground Report: Coimbatore Elections 2024 - Public Opinion & Real Issues", category = "Politics", timestamp = "1 day ago", votes = "89.4k", comments = 5820, thumbnail = "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800", videoDuration = "18:45", authorName = "Polimer News"),
        FeedItem(id = "p3", type = FeedItemType.UPDATE, title = "New alliances form ahead of state assembly elections", category = "Politics", timestamp = "30m ago", votes = "12k", comments = 400, thumbnail = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800", authorName = "Political Daily"),
        
        // Policy
        FeedItem(id = "pol1", type = FeedItemType.POLICY_TYPE, title = "New Education Policy Implementation Guidelines Released", category = "Policy", timestamp = "5h ago", votes = "12k", comments = 890, thumbnail = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=800", authorName = "Policy Watch"),
        FeedItem(id = "pol2", type = FeedItemType.FORUM, title = "Discussing the implications of the new labour codes", category = "Policy", timestamp = "12h ago", votes = "5.6k", comments = 450, thumbnail = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800", authorName = "Labor Union"),
        FeedItem(id = "pol3", type = FeedItemType.DEBATE, title = "Tax Reforms: Are they favoring the middle class?", category = "Policy", timestamp = "2 hrs ago", votes = "45k", comments = 1200, thumbnail = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800", videoDuration = "22:10", authorName = "Economic Forum"),

        // Economy
        FeedItem(id = "e1", type = FeedItemType.POLICY_TYPE, title = "How ONDC is breaking the e-commerce monopoly in India", category = "Economy", timestamp = "3h ago", votes = "12.8k", comments = 450, thumbnail = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800", authorName = "Tech Policy India"),
        FeedItem(id = "e2", type = FeedItemType.UPDATE, title = "Sensex hits new all-time high amidst positive global cues", category = "Economy", timestamp = "30m ago", votes = "45k", comments = 1205, thumbnail = "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800", authorName = "Market Today"),
        FeedItem(id = "e3", type = FeedItemType.FORUM, title = "Inflation impacts: Real estate prices skyrocket in Metro cities", category = "Economy", timestamp = "4h ago", votes = "9.5k", comments = 1500, thumbnail = "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800", authorName = "Housing Insight"),

        // Digital India
        FeedItem(id = "d1", type = FeedItemType.UPDATE, title = "UPI transactions cross 10 billion mark in a single month", category = "Digital India", timestamp = "1h ago", votes = "34k", comments = 2100, thumbnail = "https://images.unsplash.com/photo-1622397430155-22b67f082e0e?auto=format&fit=crop&q=80&w=800", authorName = "Tech News"),
        FeedItem(id = "d2", type = FeedItemType.DEBATE, title = "Data Privacy vs Innovation in Digital India", category = "Digital India", timestamp = "2 days ago", votes = "15k", comments = 3400, thumbnail = "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=800", videoDuration = "45:00", authorName = "Tech Debate"),
        FeedItem(id = "d3", type = FeedItemType.POLICY_TYPE, title = "New cyber laws aimed at securing digital identities", category = "Digital India", timestamp = "10h ago", votes = "11k", comments = 600, thumbnail = "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800", authorName = "InfoSec India"),

        // Viksit Bharat
        FeedItem(id = "v1", type = FeedItemType.FORUM, title = "Infrastructure push: 100 new airports planned under UDAN scheme", category = "Viksit Bharat", timestamp = "4h ago", votes = "22k", comments = 1500, thumbnail = "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800", authorName = "Infra News"),
        FeedItem(id = "v2", type = FeedItemType.POLICY_TYPE, title = "Green Energy transition roadmap for 2070 net-zero target", category = "Viksit Bharat", timestamp = "1 day ago", votes = "18k", comments = 900, thumbnail = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800", authorName = "Green Mobility India"),
        FeedItem(id = "v3", type = FeedItemType.UPDATE, title = "Government launches skilled workforce initiative for manufacturing", category = "Viksit Bharat", timestamp = "5h ago", votes = "55k", comments = 2200, thumbnail = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", authorName = "National Progress")
    )

    val feedItems = topNarratives + baseFeedItems


    // A flow that emits the list and periodically simulates new elements or updates realistically
    val realtimeFeedItems: Flow<List<FeedItem>> = flow {
        var currentList = baseFeedItems
        while (true) {
            emit(currentList)
            delay(5000) // update every 5 seconds
            
            // To simulate realtime "updates" efficiently, we just scramble the order slightly 
            // and modify the votes to animate the feed continuously.
            currentList = currentList.shuffled().map { 
                it.copy(
                    votes = "${(10..99).random()}.${(0..9).random()}k",
                    timestamp = "Just now" // simulates realtime fresh content
                ) 
            }
        }
    }
}
