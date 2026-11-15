package com.example.fms.data.model

enum class UserRole(val title: String, val badge: String) {
    FARMER("Farmer (Owner)", "Enterprise"),
    FARM_WORKER("Farm Worker", "Field Ops"),
    VETERINARIAN("Veterinarian", "Medical"),
    AGGREGATOR("Milk Buyer", "Procurement"),
    ADMIN("System Admin", "HQ / Ops")
}

data class DailyMilkSummary(
    val date: String,
    val morningYield: Double,
    val eveningYield: Double,
    val homeUseLitres: Double,
    val soldLitres: Double,
    val calvesLitres: Double
) {
    val totalProduced: Double get() = morningYield + eveningYield
    val totalAllocated: Double get() = homeUseLitres + soldLitres + calvesLitres
    val unallocated: Double get() = totalProduced - totalAllocated
}

data class FarmTask(
    val id: String,
    val title: String,
    val description: String,
    val status: String, // PENDING, IN_PROGRESS, COMPLETED
    val dueDate: String,
    val assignedTo: String = ""
)

data class CattleRecord(
    val id: String,
    val tagNumber: String,
    val name: String,
    val breed: String,
    val healthStatus: String, // Healthy, In Treatment, High Risk
    val dailyAvgYield: Double
)

data class MilkBatch(
    val id: String,
    val farmerName: String,
    val farmName: String,
    val litres: Double,
    val status: String, // Accepted, Pending Test, Rejected
    val time: String
)

data class VetInquiry(
    val id: String,
    val cowTag: String,
    val farmerName: String,
    val symptoms: String,
    val urgency: String, // High, Medium, Low
    val date: String
)

/**
 * Lightweight local interaction tracking for community posts
 * (avoiding heavy database bloat or unneeded session overhead)
 */
data class PostInteraction(
    val postId: String,
    val isLiked: Boolean = false,
    val isReposted: Boolean = false,
    val isBookmarked: Boolean = false,
    val timestamp: Long = System.currentTimeMillis()
)

/**
 * Lightweight community invitation model
 */
data class CommunityInvite(
    val id: String,
    val communityName: String,
    val inviteePhoneOrHandle: String,
    val invitedBy: String = "Baraka Mark",
    val status: String = "PENDING"
)

enum class SubscriptionTier(val title: String, val subtitle: String, val quotaCows: Int) {
    BASIC("Basic Plan", "Smallholder Tier • Up to 5 Cows", 5),
    ENTERPRISE("Enterprise Plan", "Commercial Tier • Unlimited Herd & AI", 9999)
}

data class IndemnityRecord(
    val policyNumber: String,
    val provider: String,
    val coverageKes: Long,
    val expiryDate: String,
    val status: String // ACTIVE, PENDING_REVIEW, EXPIRED
)

data class SavedMediaItem(
    val id: String,
    val title: String,
    val author: String,
    val handle: String,
    val timeAgo: String,
    val mediaType: String, // "POST", "VIDEO", "GUIDE"
    val snippet: String
)
