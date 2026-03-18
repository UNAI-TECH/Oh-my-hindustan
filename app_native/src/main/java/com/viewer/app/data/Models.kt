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
    val videoDuration: String? = null,
    val content: String? = null,
    val quote: String? = null,
    val isTrending: Boolean = false
)

enum class FeedItemType {
    NEWS, VIDEO, BLOG, PROMO
}

object SampleData {
    val feedItems = listOf(
        FeedItem(
            id = "1",
            type = FeedItemType.NEWS,
            isTrending = true,
            title = "Supreme Court delivers landmark verdict on electoral bonds, mandates immediate disclosure",
            category = "National Politics",
            timestamp = "2h ago",
            votes = "24.5k",
            comments = 3204,
            thumbnail = "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
            authorName = "The Hindu Analysis",
            authorImage = "https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?auto=format&fit=crop&q=80&w=100",
            excerpt = "In a unanimous decision, the Constitution Bench of the Supreme Court has struck down the Electoral Bonds scheme as unconstitutional.",
            content = "The Supreme Court of India today delivered a historic verdict striking down the Electoral Bonds scheme, declaring it unconstitutional and violative of the right to information under Article 19(1)(a) of the Constitution.\n\nA five-judge Constitution bench headed by the Chief Justice of India directed the State Bank of India (SBI) to stop the issuance of electoral bonds immediately and submit all details of bonds purchased since April 2019 to the Election Commission of India (ECI).\n\nThe court observed that anonymous corporate funding to political parties poses a severe threat to the democratic process, as it allows for quid pro quo arrangements that remain hidden from public scrutiny.",
            quote = "Information about funding to political parties is essential for the effective exercise of the choice of voting."
        ),
        FeedItem(
            id = "2",
            type = FeedItemType.NEWS,
            isTrending = true,
            title = "CM MK Stalin announces Rs. 1000 crore relief package for flood-affected southern districts",
            category = "Tamil Nadu",
            timestamp = "4h ago",
            votes = "18.2k",
            comments = 1420,
            thumbnail = "https://images.unsplash.com/photo-1622397430155-22b67f082e0e?auto=format&fit=crop&q=80&w=800",
            authorName = "News Tamil Reports",
            authorImage = "https://images.unsplash.com/photo-1533727101791-0309197c11f7?auto=format&fit=crop&q=80&w=100",
            excerpt = "Following severe rainfall and subsequent flooding in Tirunelveli and Thoothukudi, the TN Chief Minister has announced immediate relief measures.",
            content = "Chief Minister MK Stalin today announced a comprehensive relief package of Rs. 1,000 crore for the southern districts of Tamil Nadu that were severely battered by unprecedented rainfall and floods last week.\n\nSpeaking at the State Secretariat, the CM assured that affected families would receive Rs. 6,000 directly into their bank accounts. Furthermore, special camps will be set up to help residents acquire duplicate certificates and documents lost in the deluge.\n\nAgricultural compensation has also been announced for farmers who suffered heavy crop losses, with Rs. 17,000 per hectare for paddy and other irrigated crops.",
            quote = "Our priority is to ensure every affected family receives immediate assistance. The state machinery is working round the clock to restore normalcy."
        ),
        FeedItem(
            id = "3",
            type = FeedItemType.VIDEO,
            isTrending = true,
            title = "Ground Report: Coimbatore Elections 2024 - Public Opinion & Real Issues",
            subtitle = "Polimer News • 1.2M views • 1 day ago",
            authorName = "Polimer News",
            authorImage = "https://images.unsplash.com/photo-1586882829491-b8110222010b?auto=format&fit=crop&q=80&w=100",
            thumbnail = "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
            videoDuration = "18:45",
            comments = 5820,
            votes = "89.4k",
            excerpt = "Our team hit the streets of Coimbatore to understand the pulse of the voters ahead of the crucial 2024 General Elections.",
            content = "In this exclusive ground report, we travel across the urban and rural landscapes of Coimbatore constituency to hear directly from the voters. With major political shifts happening in Tamil Nadu, Coimbatore has emerged as a key battleground.\n\nLocal businesses, textile workers, and students voice their expectations regarding infrastructure, GST reforms, and employment opportunities. We also speak with local leaders from major fronts to understand their campaign strategies and promises.",
            quote = "The real issues of the people often get lost in political rhetoric. This report aims to bring the citizens' voices to the forefront."
        ),
        FeedItem(
            id = "4",
            type = FeedItemType.BLOG,
            isTrending = true,
            title = "How ONDC is breaking the e-commerce monopoly in India",
            excerpt = "The Open Network for Digital Commerce (ONDC) is transforming how local merchants compete with giant e-commerce aggregators...",
            authorName = "Tech Policy India",
            subtitle = "in Economy & Tech",
            authorImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100",
            thumbnail = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=800",
            votes = "12.8k",
            comments = 450,
            content = "The Open Network for Digital Commerce (ONDC) represents a paradigm shift in digital retail. Unlike proprietary platforms where a single entity controls the ecosystem, ONDC is an open protocol that standardizes operations like cataloging, inventory management, and order fulfillment.\n\nCreated as a government-backed initiative, ONDC aims to democratize e-commerce by enabling local mom-and-pop stores (kiranas) to access a vast pool of buyers without paying exorbitant commission fees to centralized platforms like Amazon or Flipkart.\n\nEarly adoption in cities like Bengaluru and Delhi has shown promising results in food delivery and grocery segments, where local apps are offering better pricing to consumers while ensuring higher margins for the restaurants and sellers.",
            quote = "ONDC is not an application; it is a network designed to unbundle the building blocks of e-commerce and create a level playing field."
        ),
        FeedItem(
            id = "5",
            type = FeedItemType.NEWS,
            isTrending = false,
            title = "ISRO successfully launches weather satellite INSAT-3DS",
            category = "Science & Space",
            timestamp = "12h ago",
            votes = "45k",
            comments = 1205,
            thumbnail = "https://images.unsplash.com/photo-1517976487492-5750f3195933?auto=format&fit=crop&q=80&w=800",
            authorName = "Science Today",
            excerpt = "The Indian Space Research Organisation (ISRO) successfully placed the INSAT-3DS meteorological satellite into orbit...",
            content = "In yet another milestone for India's space program, ISRO successfully launched the GSLV-F14 rocket carrying the INSAT-3DS meteorological satellite from the Satish Dhawan Space Centre in Sriharikota.\n\nThe INSAT-3DS is designed for enhanced meteorological observations and monitoring of land and ocean surfaces for weather forecasting and disaster warning. It is fully funded by the Ministry of Earth Sciences.\n\nISRO Chairman S Somanath congratulated the team, noting that this specific GSLV mission, often called the 'naughty boy' of ISRO's fleet due to its complex history, performed flawlessly, cementing India's capabilities in advanced satellite deployment.",
            quote = "This mission marks a significant step up in our atmospheric monitoring capabilities, directly contributing to better climate prediction mechanisms."
        ),
        FeedItem(
            id = "6",
            type = FeedItemType.PROMO,
            title = "Join the Jan Samvad Debate",
            subtitle = "Get verified to participate in real political discourse without the noise."
        ),
        FeedItem(
            id = "7",
            type = FeedItemType.VIDEO,
            isTrending = false,
            title = "Exclusive Interview with EAM S. Jaishankar on 'Bharat First' Foreign Policy",
            subtitle = "Times Now • 2.5M views • 3 days ago",
            authorName = "Times Now",
            authorImage = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=100",
            thumbnail = "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&q=80&w=800",
            videoDuration = "45:10",
            comments = 12400,
            votes = "150k",
            excerpt = "External Affairs Minister Dr. S. Jaishankar discusses India's strategic autonomy, ties with global powers, and the neighborhood challenge.",
            content = "In a comprehensive 45-minute interaction, External Affairs Minister Dr. S. Jaishankar eloquently broke down the nuances of India's evolving foreign policy posture on the global stage.\n\nHe addressed the complexities of maintaining strong bilateral ties with both the US and Russia amidst geopolitical turbulence. Dr. Jaishankar emphasized that India's approach is rooted in 'Strategic Autonomy' and prioritizing national interest above all—a strategy often dubbed as the 'Bharat First' approach.\n\nThe interview also touched upon border infrastructures and the ongoing diplomatic standoff with China, as well as India's rising leadership role in the Global South through platforms like the G20.",
            quote = "Europe has to grow out of the mindset that Europe's problems are the world's problems, but the world's problems are not Europe's problems."
        ),
        FeedItem(
            id = "8",
            type = FeedItemType.BLOG,
            isTrending = false,
            title = "The Rise of Electric Vehicles in India's Logistics Sector",
            authorName = "Green Mobility India",
            subtitle = "in Sustainability",
            authorImage = "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=crop&q=80&w=100",
            thumbnail = "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&q=80&w=800",
            votes = "8.2k",
            comments = 320,
            excerpt = "Last-mile delivery partners across major Indian cities are rapidly transitioning to electric two-wheelers and three-wheelers.",
            content = "The logistics and last-mile delivery sector in India is undergoing a massive green transformation. Major e-commerce and food delivery companies have committed to electrifying significant portions of their delivery fleets by 2025.\n\nThis shift is primarily driven by the lower Total Cost of Ownership (TCO) of electric two-wheelers and three-wheelers compared to their ICE (Internal Combustion Engine) counterparts. Additionally, state-level EV policies and corporate ESG goals are accelerating adoption.\n\nWhile charging infrastructure remains a challenge for long-haul operations, battery swapping networks are emerging as a viable solution for urban delivery executives, minimizing downtime and range anxiety.",
            quote = "The adoption of EVs in commercial fleets is not just an environmental imperative anymore; it is a fundamental economic advantage."
        )
    )
}
