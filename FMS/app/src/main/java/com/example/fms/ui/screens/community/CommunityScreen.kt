package com.example.fms.ui.screens.community

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.IslandButton
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
import com.example.fms.ui.theme.*

data class PostItem(
    val id: String,
    val authorName: String,
    val farmName: String,
    val county: String,
    val postType: String, // DISCUSSION, PRICE, ALERT, SURPLUS
    val title: String,
    val body: String,
    val priceKes: Double? = null,
    val litresAvailable: Double? = null,
    val isPinned: Boolean = false,
    val timeAgo: String,
    var likesCount: Int = 12,
    var isLiked: Boolean = false,
    val commentsCount: Int = 4
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityScreen(
    onOpenDirectMessage: (recipientName: String) -> Unit = {}
) {
    var selectedTab by remember { mutableStateOf("ALL") }
    var showCreatePostDialog by remember { mutableStateOf(false) }

    var posts by remember {
        mutableStateOf(
            listOf(
                PostItem(
                    id = "p1",
                    authorName = "County Vet Officer (Dr. Kiprono)",
                    farmName = "Uasin Gishu County Extension",
                    county = "Uasin Gishu",
                    postType = "ALERT",
                    title = "Foot & Mouth Quarantine Advisory - Paddock Grazing",
                    body = "Preventative vaccination campaign initiated in Eldoret South sub-county. Farmers are advised to restrict cattle movement and use footbaths at barn entries.",
                    isPinned = true,
                    timeAgo = "1 hour ago",
                    likesCount = 42,
                    commentsCount = 18
                ),
                PostItem(
                    id = "p2",
                    authorName = "Faith Chepkemoi",
                    farmName = "Chepkemoi Hill Farm",
                    county = "Nandi County",
                    postType = "SURPLUS",
                    title = "Fresh Grade-A Surplus Milk Available (350 Litres)",
                    body = "Evening milking yield exceeded local cooperative cooler quota. Looking for bulk aggregator or cheese processor pickup before 8:00 PM.",
                    priceKes = 52.0,
                    litresAvailable = 350.0,
                    timeAgo = "3 hours ago",
                    likesCount = 19,
                    commentsCount = 7
                ),
                PostItem(
                    id = "p3",
                    authorName = "David Kimani",
                    farmName = "Rift Highland Homestead",
                    county = "Nakuru County",
                    postType = "PRICE",
                    title = "Current Raw Milk Farmgate Spot Prices (October 2026)",
                    body = "Cooperative payouts in Nakuru North currently settling at KES 50 - 54/Litre. Processors offering KES 56/L for lactometer reading above 28.",
                    priceKes = 54.0,
                    timeAgo = "5 hours ago",
                    likesCount = 28,
                    commentsCount = 12
                ),
                PostItem(
                    id = "p4",
                    authorName = "Joseph Ouma",
                    farmName = "Lakeview Pastures",
                    county = "Kisumu County",
                    postType = "DISCUSSION",
                    title = "Best Silage Additives for Preserving Maize Yields?",
                    body = "We just finished chopping 12 acres of yellow maize. Who has had good experience with microbial inoculants vs molasses spray?",
                    timeAgo = "Yesterday",
                    likesCount = 15,
                    commentsCount = 9
                )
            )
        )
    }

    val filteredPosts = posts.filter {
        when (selectedTab) {
            "ALL" -> true
            "ALERT" -> it.postType == "ALERT"
            "SURPLUS" -> it.postType == "SURPLUS"
            "PRICE" -> it.postType == "PRICE"
            "DISCUSSION" -> it.postType == "DISCUSSION"
            else -> true
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Dairy Community Feed",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Market Prices, County Alerts & Surplus",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { showCreatePostDialog = true }) {
                        Surface(
                            shape = CircleShape,
                            color = EmeraldPrimary,
                            modifier = Modifier.size(36.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(Icons.Rounded.Add, contentDescription = "New Post", tint = Color.White, modifier = Modifier.size(20.dp))
                            }
                        }
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Category Filter Pills
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp, vertical = 6.dp)
                    .horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                CommunityFilterPill("ALL", "All Posts", selectedTab == "ALL") { selectedTab = "ALL" }
                CommunityFilterPill("ALERT", "⚠️ Alerts", selectedTab == "ALERT") { selectedTab = "ALERT" }
                CommunityFilterPill("SURPLUS", "🥛 Surplus Milk", selectedTab == "SURPLUS") { selectedTab = "SURPLUS" }
                CommunityFilterPill("PRICE", "📈 Prices", selectedTab == "PRICE") { selectedTab = "PRICE" }
                CommunityFilterPill("DISCUSSION", "💬 Discussions", selectedTab == "DISCUSSION") { selectedTab = "DISCUSSION" }
            }

            // Feed Posts List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                items(filteredPosts) { post ->
                    CommunityPostCard(
                        post = post,
                        onLikeClick = {
                            posts = posts.map {
                                if (it.id == post.id) {
                                    val newLiked = !it.isLiked
                                    it.copy(
                                        isLiked = newLiked,
                                        likesCount = if (newLiked) it.likesCount + 1 else it.likesCount - 1
                                    )
                                } else it
                            }
                        },
                        onDirectMessageAuthor = {
                            onOpenDirectMessage(post.authorName)
                        }
                    )
                }

                item {
                    Spacer(modifier = Modifier.height(24.dp))
                }
            }
        }
    }

    // Modal to Create Post
    if (showCreatePostDialog) {
        var postTitleInput by remember { mutableStateOf("") }
        var postBodyInput by remember { mutableStateOf("") }
        var postTypeInput by remember { mutableStateOf("DISCUSSION") }

        AlertDialog(
            onDismissRequest = { showCreatePostDialog = false },
            title = { Text("Share with Dairy Community", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedTextField(
                        value = postTitleInput,
                        onValueChange = { postTitleInput = it },
                        label = { Text("Post Headline") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    OutlinedTextField(
                        value = postBodyInput,
                        onValueChange = { postBodyInput = it },
                        label = { Text("Details (e.g. price per litre, questions)") },
                        minLines = 3,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (postTitleInput.isNotBlank()) {
                            val newPost = PostItem(
                                id = "p_${System.currentTimeMillis()}",
                                authorName = "Baraka Mark (You)",
                                farmName = "Baraka Dairy Farm",
                                county = "Uasin Gishu",
                                postType = postTypeInput,
                                title = postTitleInput,
                                body = postBodyInput,
                                timeAgo = "Just now"
                            )
                            posts = listOf(newPost) + posts
                        }
                        showCreatePostDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Publish Post")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCreatePostDialog = false }) { Text("Cancel") }
            },
            shape = RoundedCornerShape(20.dp)
        )
    }
}

@Composable
fun CommunityPostCard(
    post: PostItem,
    onLikeClick: () -> Unit,
    onDirectMessageAuthor: () -> Unit
) {
    val (typeBg, typeColor, typeLabel) = when (post.postType) {
        "ALERT" -> Triple(RoseRed.copy(alpha = 0.15f), RoseRed, "County Alert")
        "SURPLUS" -> Triple(SkyBlue.copy(alpha = 0.15f), SkyBlue, "Surplus Offer")
        "PRICE" -> Triple(GoldAmber.copy(alpha = 0.15f), GoldAmber, "Market Price")
        else -> Triple(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant, "Discussion")
    }

    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = if (post.isPinned) 5.dp else 2.dp,
        containerColor = if (post.isPinned) EmeraldPrimary.copy(alpha = 0.04f) else MaterialTheme.colorScheme.surface,
        borderColor = if (post.isPinned) EmeraldPrimary.copy(alpha = 0.4f) else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
    ) {
        Column(modifier = Modifier.padding(4.dp)) {
            // Header: Author Avatar & Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        shape = CircleShape,
                        color = typeColor.copy(alpha = 0.15f),
                        modifier = Modifier.size(38.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = post.authorName.take(2).uppercase(),
                                fontWeight = FontWeight.Bold,
                                fontSize = 14.sp,
                                color = typeColor
                            )
                        }
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = post.authorName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 14.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "${post.farmName} • ${post.county} • ${post.timeAgo}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                PillBadge(
                    text = typeLabel,
                    containerColor = typeBg,
                    contentColor = typeColor
                )
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Title
            Text(
                text = post.title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )

            Spacer(modifier = Modifier.height(4.dp))

            // Body
            Text(
                text = post.body,
                fontSize = 13.sp,
                lineHeight = 18.sp,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
            )

            // Price / Surplus info tag
            if (post.priceKes != null || post.litresAvailable != null) {
                Spacer(modifier = Modifier.height(10.dp))
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(12.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    if (post.litresAvailable != null) {
                        Text(
                            text = "Volume: ${post.litresAvailable} Litres",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = SkyBlue
                        )
                    }
                    if (post.priceKes != null) {
                        Text(
                            text = "Price: KES ${post.priceKes} / Litre",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = EmeraldPrimary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Action Bar: Likes, Comments, Direct Message Author
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(
                        modifier = Modifier.clickable(onClick = onLikeClick),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = if (post.isLiked) Icons.Rounded.Favorite else Icons.Rounded.FavoriteBorder,
                            contentDescription = "Like",
                            tint = if (post.isLiked) RoseRed else MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${post.likesCount}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = Icons.Rounded.ChatBubbleOutline,
                            contentDescription = "Comments",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "${post.commentsCount}",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                FilledTonalButton(
                    onClick = onDirectMessageAuthor,
                    shape = RoundedCornerShape(10.dp),
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp)
                ) {
                    Icon(Icons.Rounded.Send, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("Direct Message", fontSize = 11.sp, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

@Composable
fun CommunityFilterPill(
    id: String,
    title: String,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        shape = RoundedCornerShape(14.dp),
        color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)
        )
    ) {
        Text(
            text = title,
            fontSize = 12.sp,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp)
        )
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Community Feed Light")
@Composable
fun CommunityScreenPreview() {
    FMSTheme(darkTheme = false) {
        CommunityScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Community Feed Dark")
@Composable
fun CommunityScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        CommunityScreen()
    }
}
