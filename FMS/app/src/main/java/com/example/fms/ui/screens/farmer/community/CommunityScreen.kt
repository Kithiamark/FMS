package com.example.fms.ui.screens.farmer.community

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.Chat
import androidx.compose.material.icons.automirrored.rounded.Send
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class TweetPost(
    val id: String,
    val name: String,
    val handle: String,
    val isVerified: Boolean = false,
    val locationTag: String,
    val postCategory: String, // ALERT, PRICE, SURPLUS, DISCUSSION
    val content: String,
    val highlightData: String? = null,
    val timeAgo: String,
    var likes: Int,
    var reposts: Int,
    var replies: Int,
    var isLiked: Boolean = false,
    var isReposted: Boolean = false,
    var isBookmarked: Boolean = false
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityScreen(
    onOpenDirectMessage: (recipientName: String) -> Unit = {}
) {
    var selectedFeedTab by remember { mutableIntStateOf(0) } // 0: For You, 1: County Alerts, 2: Milk Prices, 3: Surplus
    var showComposer by remember { mutableStateOf(false) }

    var posts by remember {
        mutableStateOf(
            listOf(
                TweetPost(
                    id = "t1",
                    name = "Dr. Emmanuel Kiprono",
                    handle = "@kiprono_dvm",
                    isVerified = true,
                    locationTag = "Eldoret, Uasin Gishu",
                    postCategory = "ALERT",
                    content = "🚨 URGENT BIOSECURITY NOTICE: Foot & Mouth Disease (FMD) signs identified in southern pasturing corridors. Farmers: please pause inter-farm livestock trading, implement potassium permanganate wheel baths, and isolate any salivating cattle immediately.",
                    highlightData = "County Advisory • High Priority",
                    timeAgo = "18m",
                    likes = 89,
                    reposts = 34,
                    replies = 15,
                    isLiked = true
                ),
                TweetPost(
                    id = "t2",
                    name = "Faith Chepkemoi",
                    handle = "@chepkemoi_farms",
                    isVerified = false,
                    locationTag = "Kapsabet, Nandi",
                    postCategory = "SURPLUS",
                    content = "Fresh Morning Yield: 380 Litres of Grade-A Friesian milk available for immediate aggregator bulk collection. Cooler temperature chilling at 3.8°C. Lactometer test reading 29.2. First come, first dispatch!",
                    highlightData = "🥛 380 Litres • KES 52.00 / Litre",
                    timeAgo = "1h",
                    likes = 45,
                    reposts = 12,
                    replies = 8
                ),
                TweetPost(
                    id = "t3",
                    name = "Kenya Dairy Market Watch",
                    handle = "@dairy_board_updates",
                    isVerified = true,
                    locationTag = "National • Spot Index",
                    postCategory = "PRICE",
                    content = "October 2026 Farmgate Benchmark: Rift Valley formal processor payout prices have adjusted upward by +KES 2.50 to KES 54.00 - 56.50/L for lactometer densities above 28. Cooperative deductions capped at KES 2.00.",
                    highlightData = "📈 Spot Price KES 54.00 - 56.50/L",
                    timeAgo = "3h",
                    likes = 142,
                    reposts = 58,
                    replies = 24
                ),
                TweetPost(
                    id = "t4",
                    name = "Joseph Ouma",
                    handle = "@ouma_dairy_ke",
                    isVerified = false,
                    locationTag = "Muhoroni, Kisumu",
                    postCategory = "DISCUSSION",
                    content = "Silage compaction tip: Double-rolled yellow maize with 2% molasses spray dropped our spoilage waste down from 14% to under 2%. The cows finish their troughs completely without sorting.",
                    timeAgo = "5h",
                    likes = 31,
                    reposts = 6,
                    replies = 11
                )
            )
        )
    }

    val filteredPosts = remember(selectedFeedTab, posts) {
        when (selectedFeedTab) {
            1 -> posts.filter { it.postCategory == "ALERT" }
            2 -> posts.filter { it.postCategory == "PRICE" }
            3 -> posts.filter { it.postCategory == "SURPLUS" }
            else -> posts
        }
    }

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .statusBarsPadding()
            ) {
                // Twitter / X Style Clean Header
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = ForestGreen,
                        modifier = Modifier.size(34.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("BM", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldLight)
                        }
                    }

                    // Feed Title
                    Text(
                        text = "Dairy Community",
                        fontSize = 17.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface
                    )

                    IconButton(
                        onClick = { showComposer = true },
                        modifier = Modifier.size(34.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Edit,
                            contentDescription = "New Post",
                            tint = EmeraldPrimary,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }

                // Twitter-style Sticky Tab Header
                TabRow(
                    selectedTabIndex = selectedFeedTab,
                    containerColor = MaterialTheme.colorScheme.background,
                    contentColor = EmeraldPrimary,
                    divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f)) }
                ) {
                    Tab(
                        selected = selectedFeedTab == 0,
                        onClick = { selectedFeedTab = 0 },
                        text = {
                            Text(
                                "For You",
                                fontWeight = if (selectedFeedTab == 0) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    )
                    Tab(
                        selected = selectedFeedTab == 1,
                        onClick = { selectedFeedTab = 1 },
                        text = {
                            Text(
                                "Alerts",
                                fontWeight = if (selectedFeedTab == 1) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    )
                    Tab(
                        selected = selectedFeedTab == 2,
                        onClick = { selectedFeedTab = 2 },
                        text = {
                            Text(
                                "Prices",
                                fontWeight = if (selectedFeedTab == 2) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    )
                    Tab(
                        selected = selectedFeedTab == 3,
                        onClick = { selectedFeedTab = 3 },
                        text = {
                            Text(
                                "Surplus",
                                fontWeight = if (selectedFeedTab == 3) FontWeight.Bold else FontWeight.Medium,
                                fontSize = 14.sp
                            )
                        }
                    )
                }
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showComposer = true },
                containerColor = EmeraldPrimary,
                contentColor = Color.White,
                shape = CircleShape,
                elevation = FloatingActionButtonDefaults.elevation(6.dp)
            ) {
                Icon(Icons.Rounded.Add, contentDescription = "Post Tweet", modifier = Modifier.size(26.dp))
            }
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            items(filteredPosts, key = { it.id }) { post ->
                TweetItem(
                    post = post,
                    onLikeToggle = {
                        posts = posts.map {
                            if (it.id == post.id) {
                                val nextLiked = !it.isLiked
                                it.copy(
                                    isLiked = nextLiked,
                                    likes = if (nextLiked) it.likes + 1 else it.likes - 1
                                )
                            } else it
                        }
                    },
                    onRepostToggle = {
                        posts = posts.map {
                            if (it.id == post.id) {
                                val nextRepost = !it.isReposted
                                it.copy(
                                    isReposted = nextRepost,
                                    reposts = if (nextRepost) it.reposts + 1 else it.reposts - 1
                                )
                            } else it
                        }
                    },
                    onBookmarkToggle = {
                        posts = posts.map {
                            if (it.id == post.id) it.copy(isBookmarked = !it.isBookmarked) else it
                        }
                    },
                    onDirectMessage = {
                        onOpenDirectMessage(post.name)
                    }
                )
                HorizontalDivider(
                    thickness = 0.5.dp,
                    color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f)
                )
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }

    // Twitter-style Modal Tweet Composer
    if (showComposer) {
        var composerText by remember { mutableStateOf("") }
        var postCategorySelected by remember { mutableStateOf("DISCUSSION") }

        AlertDialog(
            onDismissRequest = { showComposer = false },
            title = {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Compose Post", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    PillBadge(
                        text = postCategorySelected,
                        containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = EmeraldPrimary
                    )
                }
            },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        FilterChip(
                            selected = postCategorySelected == "DISCUSSION",
                            onClick = { postCategorySelected = "DISCUSSION" },
                            label = { Text("Discussion", fontSize = 11.sp) }
                        )
                        FilterChip(
                            selected = postCategorySelected == "SURPLUS",
                            onClick = { postCategorySelected = "SURPLUS" },
                            label = { Text("Surplus", fontSize = 11.sp) }
                        )
                        FilterChip(
                            selected = postCategorySelected == "PRICE",
                            onClick = { postCategorySelected = "PRICE" },
                            label = { Text("Price", fontSize = 11.sp) }
                        )
                    }

                    OutlinedTextField(
                        value = composerText,
                        onValueChange = { composerText = it },
                        placeholder = { Text("What's happening on your farm? (Milk yield, tips, price updates)...") },
                        minLines = 4,
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp)
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (composerText.isNotBlank()) {
                            val newPost = TweetPost(
                                id = "t_${System.currentTimeMillis()}",
                                name = "Baraka Mark",
                                handle = "@baraka_farm",
                                isVerified = true,
                                locationTag = "Eldoret, Uasin Gishu",
                                postCategory = postCategorySelected,
                                content = composerText,
                                timeAgo = "Just now",
                                likes = 1,
                                reposts = 0,
                                replies = 0
                            )
                            posts = listOf(newPost) + posts
                        }
                        showComposer = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Text("Post", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showComposer = false }) { Text("Cancel") }
            },
            shape = RoundedCornerShape(24.dp)
        )
    }
}

@Composable
fun TweetItem(
    post: TweetPost,
    onLikeToggle: () -> Unit,
    onRepostToggle: () -> Unit,
    onBookmarkToggle: () -> Unit,
    onDirectMessage: () -> Unit
) {
    val categoryBadge = when (post.postCategory) {
        "ALERT" -> Pair(RoseRed.copy(alpha = 0.15f), RoseRed)
        "SURPLUS" -> Pair(SkyBlue.copy(alpha = 0.15f), SkyBlue)
        "PRICE" -> Pair(GoldAmber.copy(alpha = 0.15f), GoldAmber)
        else -> Pair(MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
    }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { }
            .padding(horizontal = 16.dp, vertical = 14.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Left Column: User Avatar
        Surface(
            shape = CircleShape,
            color = EmeraldPrimary.copy(alpha = 0.15f),
            modifier = Modifier.size(44.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Text(
                    text = post.name.take(2).uppercase(),
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = EmeraldPrimary
                )
            }
        }

        // Right Column: Post Body & Interaction Icons
        Column(modifier = Modifier.weight(1f)) {
            // Header Row: Name, Verified Badge, Handle, Time
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = post.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1
                )
                if (post.isVerified) {
                    Spacer(modifier = Modifier.width(3.dp))
                    Icon(
                        imageVector = Icons.Rounded.CheckCircle,
                        contentDescription = "Verified",
                        tint = EmeraldPrimary,
                        modifier = Modifier.size(15.dp)
                    )
                }
                Spacer(modifier = Modifier.width(5.dp))
                Text(
                    text = post.handle,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1
                )
                Text(
                    text = " · ${post.timeAgo}",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }

            // Location Tag
            Text(
                text = "📍 ${post.locationTag}",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )

            Spacer(modifier = Modifier.height(6.dp))

            // Post Text
            Text(
                text = post.content,
                fontSize = 14.sp,
                lineHeight = 20.sp,
                color = MaterialTheme.colorScheme.onSurface
            )

            // Special Highlight Chip (for Alerts, Surplus L/Price)
            if (post.highlightData != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = categoryBadge.first,
                    border = androidx.compose.foundation.BorderStroke(1.dp, categoryBadge.second.copy(alpha = 0.3f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = post.highlightData,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Bold,
                        color = categoryBadge.second,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 7.dp)
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Twitter Interaction Row (Reply, Retweet, Like, DM, Share)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Reply
                Row(
                    modifier = Modifier.clickable { },
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.Chat,
                        contentDescription = "Replies",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(17.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${post.replies}",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Repost / Retweet
                Row(
                    modifier = Modifier.clickable(onClick = onRepostToggle),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Repeat,
                        contentDescription = "Repost",
                        tint = if (post.isReposted) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "${post.reposts}",
                        fontSize = 12.sp,
                        color = if (post.isReposted) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Like
                Row(
                    modifier = Modifier.clickable(onClick = onLikeToggle),
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
                        text = "${post.likes}",
                        fontSize = 12.sp,
                        color = if (post.isLiked) RoseRed else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                // Bookmark
                IconButton(
                    onClick = onBookmarkToggle,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = if (post.isBookmarked) Icons.Rounded.Bookmark else Icons.Rounded.BookmarkBorder,
                        contentDescription = "Bookmark",
                        tint = if (post.isBookmarked) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(17.dp)
                    )
                }

                // Direct Message / Send
                IconButton(
                    onClick = onDirectMessage,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Rounded.Send,
                        contentDescription = "Direct Message",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Twitter-Style Community Light")
@Composable
fun CommunityScreenPreview() {
    FMSTheme(darkTheme = false) {
        CommunityScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Twitter-Style Community Dark")
@Composable
fun CommunityScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        CommunityScreen()
    }
}
