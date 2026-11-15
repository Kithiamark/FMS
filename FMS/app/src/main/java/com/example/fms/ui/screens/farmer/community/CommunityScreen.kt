package com.example.fms.ui.screens.farmer.community

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.platform.LocalContext
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*
import com.example.fms.util.ShareUtils

data class CommentItem(
    val id: String,
    val authorName: String,
    val handle: String,
    val text: String,
    val timeAgo: String
)

data class TweetPost(
    val id: String,
    val name: String,
    val handle: String,
    val isVerified: Boolean = false,
    val isVetVerified: Boolean = false,
    val kvbNumber: String? = null,
    val locationTag: String,
    val communityTag: String = "General Dairy",
    val content: String,
    val highlightData: String? = null,
    val timeAgo: String,
    var likes: Int,
    var reposts: Int,
    var replies: Int,
    var isLiked: Boolean = false,
    var isReposted: Boolean = false,
    var isBookmarked: Boolean = false,
    val comments: List<CommentItem> = emptyList()
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CommunityScreen(
    onOpenDirectMessage: (recipientName: String) -> Unit = {},
    onNavigateToAIOverview: () -> Unit = {}
) {
    // Community circles available in the cooperative
    var communities by remember {
        mutableStateOf(
            listOf(
                "All Posts",
                "General Dairy",
                "Milk Prices & Aggregators",
                "Disease & Vet Alerts",
                "Breeding & Feeds"
            )
        )
    }
    var selectedCommunity by remember { mutableStateOf("All Posts") }
    var showCreateCommunityDialog by remember { mutableStateOf(false) }
    var showCommunityDrawer by remember { mutableStateOf(false) }

    // Bottom sheet state for Compose Post Drawer
    var showPostDrawer by remember { mutableStateOf(false) }
    val postSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    // Bottom sheet state for Commenting Drawer
    var activeCommentPost by remember { mutableStateOf<TweetPost?>(null) }
    val commentSheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    var posts by remember {
        mutableStateOf(
            listOf(
                TweetPost(
                    id = "t1",
                    name = "Dr. Emmanuel Kiprono",
                    handle = "@kiprono_dvm",
                    isVerified = true,
                    isVetVerified = true,
                    kvbNumber = "KVB #4102",
                    locationTag = "Eldoret, Uasin Gishu",
                    communityTag = "Disease & Vet Alerts",
                    content = "🚨 URGENT BIOSECURITY NOTICE: Foot & Mouth Disease (FMD) signs identified in southern pasturing corridors. Farmers: please pause inter-farm livestock trading, implement foot baths, and isolate any salivating cattle immediately.",
                    highlightData = "County Advisory • High Priority",
                    timeAgo = "18m",
                    likes = 89,
                    reposts = 34,
                    replies = 2,
                    isLiked = true,
                    comments = listOf(
                        CommentItem("c1", "Baraka Farm", "@baraka_farm", "Thank you Daktari! Are ring vaccinations currently stocked at the county sub-office?", "10m ago"),
                        CommentItem("c2", "Faith Chepkemoi", "@chepkemoi_farms", "Good catch. We have locked entry gates for visitors at Nandi ridge.", "5m ago")
                    )
                ),
                TweetPost(
                    id = "t2",
                    name = "Faith Chepkemoi",
                    handle = "@chepkemoi_farms",
                    isVerified = false,
                    locationTag = "Kapsabet, Nandi",
                    communityTag = "Milk Prices & Aggregators",
                    content = "Fresh Morning Yield: 380 Litres of Grade-A Friesian milk available for immediate aggregator bulk collection. Cooler temperature chilling at 3.8°C. Lactometer test reading 29.2. First come, first dispatch!",
                    highlightData = "🥛 380 Litres • KES 52.00 / Litre",
                    timeAgo = "1h",
                    likes = 45,
                    reposts = 12,
                    replies = 1,
                    comments = listOf(
                        CommentItem("c3", "Brookside Transporter", "@aggregator_rift", "Dispatch tanker is 15 mins away from your route, please reserve 200L.", "35m ago")
                    )
                ),
                TweetPost(
                    id = "t3",
                    name = "Kenya Dairy Market Watch",
                    handle = "@dairy_board_updates",
                    isVerified = true,
                    locationTag = "National • Spot Index",
                    communityTag = "Milk Prices & Aggregators",
                    content = "October 2026 Farmgate Benchmark: Rift Valley formal processor payout prices have adjusted upward by +KES 2.50 to KES 54.00 - 56.50/L for lactometer densities above 28. Cooperative deductions capped at KES 2.00.",
                    highlightData = "📈 Spot Price KES 54.00 - 56.50/L",
                    timeAgo = "3h",
                    likes = 142,
                    reposts = 58,
                    replies = 0
                ),
                TweetPost(
                    id = "t4",
                    name = "Joseph Ouma",
                    handle = "@ouma_dairy_ke",
                    isVerified = false,
                    locationTag = "Muhoroni, Kisumu",
                    communityTag = "Breeding & Feeds",
                    content = "Silage compaction tip: Double-rolled yellow maize with 2% molasses spray dropped our spoilage waste down from 14% to under 2%. The cows finish their troughs completely without sorting.",
                    timeAgo = "5h",
                    likes = 31,
                    reposts = 6,
                    replies = 0
                )
            )
        )
    }

    val filteredPosts = remember(selectedCommunity, posts) {
        if (selectedCommunity == "All Posts") posts
        else posts.filter { it.communityTag == selectedCommunity }
    }

    val context = LocalContext.current

    Scaffold(
        topBar = {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.background)
                    .statusBarsPadding()
            ) {
                // Twitter / X Style Clean Header with Sidebar Switcher & AI Overview
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        modifier = Modifier.clickable { showCommunityDrawer = true }
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
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = selectedCommunity,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface,
                                maxLines = 1
                            )
                            Icon(Icons.Rounded.ArrowDropDown, contentDescription = "Switch", tint = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    // Action Icons: AI Overview Button (replaces pen icon) + Compose Post
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        IconButton(
                            onClick = onNavigateToAIOverview,
                            modifier = Modifier.size(36.dp)
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = EmeraldPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(32.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Icon(
                                        imageVector = Icons.Rounded.AutoAwesome,
                                        contentDescription = "AI Overview & Reports",
                                        tint = EmeraldPrimary,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }
                        }

                        IconButton(
                            onClick = { showPostDrawer = true },
                            modifier = Modifier.size(36.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.EditNote,
                                contentDescription = "New Post",
                                tint = MaterialTheme.colorScheme.onSurface,
                                modifier = Modifier.size(24.dp)
                            )
                        }
                    }
                }

                // Community Filter Chips with Create Community Action
                LazyRow(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 12.dp, vertical = 6.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    item {
                        // Create Community Button
                        OutlinedButton(
                            onClick = { showCreateCommunityDialog = true },
                            shape = RoundedCornerShape(20.dp),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("New Community", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        }
                    }

                    items(communities) { comm ->
                        val isSelected = selectedCommunity == comm
                        FilterChip(
                            selected = isSelected,
                            onClick = { selectedCommunity = comm },
                            label = { Text(comm, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium) },
                            shape = RoundedCornerShape(20.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                selectedLabelColor = EmeraldPrimary
                            )
                        )
                    }
                }
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.25f))
            }
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { showPostDrawer = true },
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
            contentPadding = PaddingValues(bottom = 110.dp),
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            items(filteredPosts, key = { it.id }) { post ->
                TweetItem(
                    post = post,
                    onCommentClick = {
                        activeCommentPost = post
                    },
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
                    },
                    onSharePost = {
                        ShareUtils.sharePost(
                            context = context,
                            postId = post.id,
                            authorName = post.name,
                            contentSnippet = post.content.take(80)
                        )
                    },
                    onWhatsAppShare = {
                        ShareUtils.sharePost(
                            context = context,
                            postId = post.id,
                            authorName = post.name,
                            contentSnippet = post.content.take(80),
                            targetWhatsApp = true
                        )
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

    // --- DRAWER-LIKE INPUT FOR NEW POST (Bottom Sheet Drawer) ---
    if (showPostDrawer) {
        ModalBottomSheet(
            onDismissRequest = { showPostDrawer = false },
            sheetState = postSheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            var composerText by remember { mutableStateOf("") }
            var targetCommunity by remember {
                mutableStateOf(
                    if (selectedCommunity == "All Posts") "General Dairy" else selectedCommunity
                )
            }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.88f)
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 28.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Drawer Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("New Community Post", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                    IconButton(onClick = { showPostDrawer = false }) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close")
                    }
                }

                // Community Selector
                Text("Post into Community:", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(communities.filter { it != "All Posts" }) { comm ->
                        FilterChip(
                            selected = targetCommunity == comm,
                            onClick = { targetCommunity = comm },
                            label = { Text(comm, fontSize = 11.sp) },
                            shape = RoundedCornerShape(16.dp)
                        )
                    }
                }

                // Drawer Input Field
                OutlinedTextField(
                    value = composerText,
                    onValueChange = { composerText = it },
                    placeholder = { Text("Share milk yields, questions, price updates, or farm tips...") },
                    minLines = 6,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp)
                )

                // Bottom Post Action
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Button(
                        onClick = {
                            if (composerText.isNotBlank()) {
                                val newPost = TweetPost(
                                    id = "t_${System.currentTimeMillis()}",
                                    name = "Baraka Mark",
                                    handle = "@baraka_farm",
                                    isVerified = true,
                                    locationTag = "Eldoret, Uasin Gishu",
                                    communityTag = targetCommunity,
                                    content = composerText,
                                    timeAgo = "Just now",
                                    likes = 1,
                                    reposts = 0,
                                    replies = 0
                                )
                                posts = listOf(newPost) + posts
                            }
                            showPostDrawer = false
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(20.dp),
                        modifier = Modifier.height(44.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Rounded.Send, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Post to Community", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // --- COMMENTS DRAWER (Bottom Sheet) ---
    activeCommentPost?.let { currentPost ->
        ModalBottomSheet(
            onDismissRequest = { activeCommentPost = null },
            sheetState = commentSheetState,
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            var newCommentText by remember { mutableStateOf("") }

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.9f)
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 24.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Replies (${currentPost.comments.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp
                    )
                    IconButton(onClick = { activeCommentPost = null }) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close")
                    }
                }

                // Original Post Snippet
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            text = "${currentPost.name} (${currentPost.handle})",
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = currentPost.content,
                            fontSize = 12.sp,
                            maxLines = 2,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Existing Threaded Comments List
                if (currentPost.comments.isEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(vertical = 24.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("No replies yet. Be the first to reply!", fontSize = 13.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                } else {
                    LazyColumn(
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(currentPost.comments, key = { it.id }) { c ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(vertical = 2.dp),
                                horizontalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                // Left Thread vertical connection bar & Avatar
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Surface(
                                        shape = CircleShape,
                                        color = EmeraldPrimary.copy(alpha = 0.15f),
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(c.authorName.take(1), fontSize = 13.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                                        }
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Box(
                                        modifier = Modifier
                                            .width(2.dp)
                                            .height(28.dp)
                                            .background(EmeraldPrimary.copy(alpha = 0.25f))
                                    )
                                }

                                Column(modifier = Modifier.weight(1f)) {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Text(c.authorName, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                        Text(c.handle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                        Text("· ${c.timeAgo}", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = c.text,
                                        fontSize = 13.sp,
                                        lineHeight = 18.sp,
                                        color = MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                // Reply Input Bar
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = newCommentText,
                        onValueChange = { newCommentText = it },
                        placeholder = { Text("Write a reply...", fontSize = 13.sp) },
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(20.dp),
                        singleLine = true
                    )
                    IconButton(
                        onClick = {
                            if (newCommentText.isNotBlank()) {
                                val newComment = CommentItem(
                                    id = "c_${System.currentTimeMillis()}",
                                    authorName = "Baraka Mark",
                                    handle = "@baraka_farm",
                                    text = newCommentText,
                                    timeAgo = "Just now"
                                )
                                posts = posts.map { p ->
                                    if (p.id == currentPost.id) {
                                        val updatedComments = p.comments + newComment
                                        p.copy(
                                            comments = updatedComments,
                                            replies = updatedComments.size
                                        )
                                    } else p
                                }
                                activeCommentPost = activeCommentPost?.copy(
                                    comments = (activeCommentPost?.comments ?: emptyList()) + newComment,
                                    replies = (activeCommentPost?.replies ?: 0) + 1
                                )
                                newCommentText = ""
                            }
                        },
                        colors = IconButtonDefaults.iconButtonColors(containerColor = EmeraldPrimary, contentColor = Color.White),
                        modifier = Modifier.size(42.dp)
                    ) {
                        Icon(Icons.AutoMirrored.Rounded.Send, contentDescription = "Send Reply", modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }

    // --- CREATE NEW COMMUNITY MODAL ---
    if (showCreateCommunityDialog) {
        var newCommName by remember { mutableStateOf("") }
        var inviteContacts by remember { mutableStateOf("") }
        IslandModal(
            isOpen = showCreateCommunityDialog,
            onDismissRequest = { showCreateCommunityDialog = false },
            title = "Create Community",
            icon = Icons.Rounded.Groups,
            badgeText = "New Topical Group",
            confirmButton = {
                Button(
                    onClick = {
                        val trimmed = newCommName.trim()
                        if (trimmed.isNotBlank() && !communities.contains(trimmed)) {
                            communities = communities + trimmed
                            selectedCommunity = trimmed
                        }
                        showCreateCommunityDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Create Space", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showCreateCommunityDialog = false },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Cancel")
                }
            }
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text(
                    text = "Create a new topical space for local farmers, aggregators, or breeders:",
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = newCommName,
                    onValueChange = { newCommName = it },
                    label = { Text("Community Name") },
                    placeholder = { Text("e.g. Nandi Silage Group") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                OutlinedTextField(
                    value = inviteContacts,
                    onValueChange = { inviteContacts = it },
                    label = { Text("Invite Members (Optional)") },
                    placeholder = { Text("Phone numbers or usernames, comma separated") },
                    minLines = 2,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )
                Text(
                    text = "💡 Invitees will receive an SMS / in-app link to join this discussion space.",
                    fontSize = 11.sp,
                    color = EmeraldPrimary
                )
            }
        }
    }

    // --- COMMUNITY SWITCHER DRAWER (Modal Bottom Sheet) ---
    if (showCommunityDrawer) {
        val communityMetadata = listOf(
            Pair("All Posts", "Combined feed across all dairy circles and market updates"),
            Pair("General Dairy", "Farm operations, stall management & cow routines"),
            Pair("Milk Prices & Aggregators", "Offtake prices, chilling hub notices & collection"),
            Pair("Disease & Vet Alerts", "FMD, ECF, biosecurity & official KVB updates"),
            Pair("Breeding & Feeds", "Silage, fodder crops, AI genetics & heat detection")
        )

        ModalBottomSheet(
            onDismissRequest = { showCommunityDrawer = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 32.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Switch Dairy Space",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Select a community space to filter your discussions",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    TextButton(onClick = {
                        showCommunityDrawer = false
                        showCreateCommunityDialog = true
                    }) {
                        Icon(Icons.Rounded.Add, contentDescription = null, modifier = Modifier.size(16.dp), tint = ForestGreen)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text("Create", color = ForestGreen, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    }
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))

                communityMetadata.forEach { (commTitle, commDesc) ->
                    val isSelected = selectedCommunity == commTitle
                    Surface(
                        shape = RoundedCornerShape(16.dp),
                        color = if (isSelected) EmeraldPrimary.copy(alpha = 0.12f) else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                        border = androidx.compose.foundation.BorderStroke(
                            width = if (isSelected) 1.5.dp else 0.5.dp,
                            color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                        ),
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable {
                                selectedCommunity = commTitle
                                showCommunityDrawer = false
                            }
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = commTitle,
                                    fontSize = 15.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(
                                    text = commDesc,
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            if (isSelected) {
                                Spacer(modifier = Modifier.width(8.dp))
                                Icon(
                                    imageVector = Icons.Rounded.CheckCircle,
                                    contentDescription = "Selected",
                                    tint = EmeraldPrimary,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun TweetItem(
    post: TweetPost,
    onCommentClick: () -> Unit,
    onLikeToggle: () -> Unit,
    onRepostToggle: () -> Unit,
    onBookmarkToggle: () -> Unit,
    onDirectMessage: () -> Unit,
    onSharePost: () -> Unit = {},
    onWhatsAppShare: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onCommentClick)
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
                if (post.isVetVerified) {
                    Spacer(modifier = Modifier.width(4.dp))
                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = EmeraldPrimary.copy(alpha = 0.15f),
                        border = androidx.compose.foundation.BorderStroke(0.5.dp, EmeraldPrimary)
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 5.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(3.dp)
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.VerifiedUser,
                                contentDescription = "KVB Verified Vet",
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(12.dp)
                            )
                            Text(
                                text = "Certified Vet",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = EmeraldPrimary
                            )
                        }
                    }
                } else if (post.isVerified) {
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

            // Community Tag Pill
            Spacer(modifier = Modifier.height(3.dp))
            PillBadge(
                text = post.communityTag,
                containerColor = ForestGreen.copy(alpha = 0.1f),
                contentColor = ForestGreen
            )

            // Post Content Text
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = post.content,
                fontSize = 14.sp,
                lineHeight = 20.sp,
                color = MaterialTheme.colorScheme.onSurface
            )

            // Optional Highlight Card (e.g. Alert or Surplus milk)
            post.highlightData?.let { highlight ->
                Spacer(modifier = Modifier.height(8.dp))
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text(
                        text = highlight,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp)
                    )
                }
            }

            // Bottom Interaction Bar (Replies, Reposts, Likes, Bookmark, DM, Share)
            Spacer(modifier = Modifier.height(10.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Reply / Comment Button
                Row(
                    modifier = Modifier.clickable(onClick = onCommentClick),
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

                // Direct Message / Chat
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

                // Share Link (WhatsApp & General)
                IconButton(
                    onClick = onSharePost,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        imageVector = Icons.Rounded.Share,
                        contentDescription = "Share Post Link",
                        tint = EmeraldPrimary,
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
