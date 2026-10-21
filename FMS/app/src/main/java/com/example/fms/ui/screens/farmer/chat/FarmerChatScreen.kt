package com.example.fms.ui.screens.farmer.chat

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
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
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

data class ChatBubbleMessage(
    val id: String,
    val content: String,
    val time: String,
    val isOutgoing: Boolean,
    val isRead: Boolean = true
)

data class FarmContactThread(
    val id: String,
    val name: String,
    val roleBadge: String,
    val lastMessage: String,
    val time: String,
    val unreadCount: Int = 0,
    val isOnline: Boolean = false
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FarmerChatScreen(
    initialRecipient: String? = null,
    onBackClick: () -> Unit = {}
) {
    var activeThread by remember {
        mutableStateOf(
            if (initialRecipient != null) {
                FarmContactThread(
                    id = "c_active",
                    name = initialRecipient,
                    roleBadge = "Veterinarian",
                    lastMessage = "Let's review the cattle case.",
                    time = "Just now",
                    isOnline = true
                )
            } else null
        )
    }

    var messageInput by remember { mutableStateOf("") }

    var messages by remember {
        mutableStateOf(
            listOf(
                ChatBubbleMessage("1", "Habari Baraka! Dr. Kiprono here. Received your telemetry update on Cow #104.", "09:30 AM", false),
                ChatBubbleMessage("2", "Morning Daktari. The morning yield fell from 18L to 11L, and she has localized fever in her rear udder quarter.", "09:32 AM", true, true),
                ChatBubbleMessage("3", "Good catch. Have you run the California Mastitis Test (CMT) paddle yet?", "09:34 AM", false),
                ChatBubbleMessage("4", "Yes, paddle turned gel-like in the rear right quadrant. Strongly positive.", "09:36 AM", true, true),
                ChatBubbleMessage("5", "Understood. Please isolate her from the bulk cooler intake immediately. I am currently on a farm visit in Annex, will head your way at 11:30 AM with intramammary antibiotics.", "09:38 AM", false)
            )
        )
    }

    val threads = remember {
        listOf(
            FarmContactThread("1", "Dr. Emmanuel Kiprono", "Vet", "I will head your way at 11:30 AM with antibiotics.", "09:38 AM", 1, true),
            FarmContactThread("2", "Eldoret Bulk Cooler Depot", "Aggregator", "Batch #B-104 Lactometer verified: 29.5. Approved.", "Yesterday", 0, false),
            FarmContactThread("3", "Faith Chepkemoi", "Farmer", "Can your milk driver carry 120L from my farm today?", "Oct 19", 0, false),
            FarmContactThread("4", "Barn Operations (Kip)", "Worker", "Silage pit 2 covered for the rains boss.", "Oct 18", 0, true)
        )
    }

    Scaffold(
        topBar = {
            if (activeThread == null) {
                // Thread Hub Header (FMS Forest Green Theme)
                TopAppBar(
                    title = {
                        Column {
                            Text(
                                text = "Farm Messaging",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Secure Consultations & Dispatch",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    },
                    actions = {
                        IconButton(onClick = {}) {
                            Icon(Icons.Rounded.Search, contentDescription = "Search", tint = EmeraldPrimary)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
                )
            } else {
                // Active Conversation Header with Pill Avatar & Status
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(14.dp),
                                color = EmeraldPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(40.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = activeThread!!.name.take(2).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = EmeraldPrimary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = activeThread!!.name,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Text(
                                    text = if (activeThread!!.isOnline) "Active now • ${activeThread!!.roleBadge}" else activeThread!!.roleBadge,
                                    fontSize = 11.sp,
                                    color = if (activeThread!!.isOnline) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { activeThread = null }) {
                            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = MaterialTheme.colorScheme.onSurface)
                        }
                    },
                    actions = {
                        IconButton(onClick = {}) {
                            Icon(Icons.Rounded.Phone, contentDescription = "Call", tint = EmeraldPrimary)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
                )
            }
        },
        bottomBar = {
            if (activeThread != null) {
                // Elegant Pill Input Bar (No Audio Recording, Clean Bubble Design)
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 14.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(24.dp),
                            color = MaterialTheme.colorScheme.surface,
                            border = androidx.compose.foundation.BorderStroke(
                                1.dp,
                                MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
                            ),
                            shadowElevation = 2.dp
                        ) {
                            Row(
                                modifier = Modifier.padding(horizontal = 14.dp, vertical = 4.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                OutlinedTextField(
                                    value = messageInput,
                                    onValueChange = { messageInput = it },
                                    placeholder = { Text("Write a message...", fontSize = 14.sp) },
                                    modifier = Modifier.weight(1f),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = Color.Transparent,
                                        unfocusedBorderColor = Color.Transparent
                                    ),
                                    maxLines = 4
                                )
                                Icon(
                                    imageVector = Icons.Rounded.AttachFile,
                                    contentDescription = "Attach Document or Cow Photo",
                                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier
                                        .size(20.dp)
                                        .clickable { }
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(8.dp))

                        // High-Affordance Send Pill Button
                        Surface(
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .clickable {
                                    if (messageInput.isNotBlank()) {
                                        val newMsg = ChatBubbleMessage(
                                            id = "m_${System.currentTimeMillis()}",
                                            content = messageInput,
                                            time = "Just now",
                                            isOutgoing = true,
                                            isRead = false
                                        )
                                        messages = messages + newMsg
                                        messageInput = ""
                                    }
                                },
                            shape = CircleShape,
                            color = if (messageInput.isNotBlank()) EmeraldPrimary else MaterialTheme.colorScheme.surfaceVariant,
                            shadowElevation = if (messageInput.isNotBlank()) 4.dp else 0.dp
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Rounded.Send,
                                    contentDescription = "Send",
                                    tint = if (messageInput.isNotBlank()) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                                    modifier = Modifier.size(20.dp)
                                )
                            }
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        if (activeThread == null) {
            // Thread List with Floating Island Cards
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(MaterialTheme.colorScheme.background),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(threads) { thread ->
                    IslandCard(
                        modifier = Modifier.fillMaxWidth(),
                        elevation = 2.dp,
                        onClick = { activeThread = thread }
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                                Box {
                                    Surface(
                                        shape = RoundedCornerShape(16.dp),
                                        color = EmeraldPrimary.copy(alpha = 0.12f),
                                        modifier = Modifier.size(46.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = thread.name.take(2).uppercase(),
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 15.sp,
                                                color = EmeraldPrimary
                                            )
                                        }
                                    }
                                    if (thread.isOnline) {
                                        Box(
                                            modifier = Modifier
                                                .size(11.dp)
                                                .clip(CircleShape)
                                                .background(EmeraldPrimary)
                                                .align(Alignment.BottomEnd)
                                        )
                                    }
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text(
                                            text = thread.name,
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 15.sp,
                                            color = MaterialTheme.colorScheme.onSurface
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        PillBadge(
                                            text = thread.roleBadge,
                                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                            contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(2.dp))
                                    Text(
                                        text = thread.lastMessage,
                                        fontSize = 12.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                        maxLines = 1
                                    )
                                }
                            }

                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    text = thread.time,
                                    fontSize = 11.sp,
                                    color = if (thread.unreadCount > 0) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                                    fontWeight = if (thread.unreadCount > 0) FontWeight.Bold else FontWeight.Normal
                                )
                                if (thread.unreadCount > 0) {
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Surface(
                                        shape = CircleShape,
                                        color = EmeraldPrimary,
                                        modifier = Modifier.size(18.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Text(
                                                text = "${thread.unreadCount}",
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = Color.White
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } else {
            // Bubble Canvas with Soft Curvature & Pill Accents
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(MaterialTheme.colorScheme.background),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            shape = RoundedCornerShape(12.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ) {
                            Text(
                                text = "🔒 Confidential Veterinary & Farm Production Channel",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 5.dp)
                            )
                        }
                    }
                }

                items(messages) { msg ->
                    FMSBubble(message = msg)
                }
            }
        }
    }
}

@Composable
fun FMSBubble(message: ChatBubbleMessage) {
    val isMe = message.isOutgoing

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 20.dp,
                topEnd = 20.dp,
                bottomStart = if (isMe) 20.dp else 4.dp,
                bottomEnd = if (isMe) 4.dp else 20.dp
            ),
            color = if (isMe) EmeraldPrimary else MaterialTheme.colorScheme.surface,
            border = if (!isMe) androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f)) else null,
            shadowElevation = 2.dp,
            modifier = Modifier.widthIn(max = 290.dp)
        ) {
            Column(modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp)) {
                Text(
                    text = message.content,
                    fontSize = 14.sp,
                    lineHeight = 20.sp,
                    color = if (isMe) Color.White else MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.align(Alignment.End),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = message.time,
                        fontSize = 10.sp,
                        fontWeight = FontWeight.Medium,
                        color = if (isMe) Color.White.copy(alpha = 0.75f) else MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    if (isMe) {
                        Spacer(modifier = Modifier.width(4.dp))
                        Icon(
                            imageVector = Icons.Rounded.DoneAll,
                            contentDescription = "Read",
                            tint = if (message.isRead) SkyBlue else Color.White.copy(alpha = 0.6f),
                            modifier = Modifier.size(13.dp)
                        )
                    }
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Farmer Chat Light")
@Composable
fun FarmerChatScreenPreview() {
    FMSTheme(darkTheme = false) {
        FarmerChatScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Farmer Chat Dark")
@Composable
fun FarmerChatScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        FarmerChatScreen()
    }
}
