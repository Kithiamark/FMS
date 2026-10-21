package com.example.fms.ui.screens.chat

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
import com.example.fms.ui.theme.*

data class WhatsAppMessage(
    val id: String,
    val content: String,
    val time: String,
    val isOutgoing: Boolean,
    val isRead: Boolean = true
)

data class WhatsAppChatThread(
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
fun ChatScreen(
    initialRecipient: String? = null,
    onBackClick: () -> Unit = {}
) {
    var activeThread by remember {
        mutableStateOf(
            if (initialRecipient != null) {
                WhatsAppChatThread(
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

    var textInput by remember { mutableStateOf("") }

    var messages by remember {
        mutableStateOf(
            listOf(
                WhatsAppMessage("1", "Habari Baraka! Dr. Kiprono here. Received your telemetry update on Cow #104.", "09:30 AM", false),
                WhatsAppMessage("2", "Morning Daktari. The morning yield fell from 18L to 11L, and she has localized fever in her rear udder quarter.", "09:32 AM", true, true),
                WhatsAppMessage("3", "Good catch. Have you run the California Mastitis Test (CMT) paddle yet?", "09:34 AM", false),
                WhatsAppMessage("4", "Yes, paddle turned gel-like in the rear right quadrant. Strongly positive.", "09:36 AM", true, true),
                WhatsAppMessage("5", "Understood. Please isolate her from the bulk cooler intake immediately. I am currently on a farm visit in Annex, will head your way at 11:30 AM with intramammary antibiotics.", "09:38 AM", false)
            )
        )
    }

    val threads = remember {
        listOf(
            WhatsAppChatThread(
                id = "1",
                name = "Dr. Emmanuel Kiprono",
                roleBadge = "Vet",
                lastMessage = "I am currently on a farm visit in Annex...",
                time = "09:38 AM",
                unreadCount = 2,
                isOnline = true
            ),
            WhatsAppChatThread(
                id = "2",
                name = "Eldoret Dairy Co-op Intake",
                roleBadge = "Aggregator",
                lastMessage = "Batch #B-104 Lactometer verified: 29.5. Approved.",
                time = "Yesterday",
                unreadCount = 0,
                isOnline = false
            ),
            WhatsAppChatThread(
                id = "3",
                name = "Faith Chepkemoi",
                roleBadge = "Farmer",
                lastMessage = "Can your milk driver carry 120L from my farm today?",
                time = "Oct 19",
                unreadCount = 0,
                isOnline = false
            ),
            WhatsAppChatThread(
                id = "4",
                name = "Barn Field Operations (Kip)",
                roleBadge = "Worker",
                lastMessage = "Silage pit 2 covered for the rains boss.",
                time = "Oct 18",
                unreadCount = 0,
                isOnline = true
            )
        )
    }

    Scaffold(
        topBar = {
            if (activeThread == null) {
                // WhatsApp Home Header
                TopAppBar(
                    title = {
                        Text(
                            text = "FMS Chat",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    },
                    actions = {
                        IconButton(onClick = {}) {
                            Icon(Icons.Rounded.Search, contentDescription = "Search", tint = Color.White)
                        }
                        IconButton(onClick = {}) {
                            Icon(Icons.Rounded.MoreVert, contentDescription = "More", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = ForestGreen
                    )
                )
            } else {
                // WhatsApp Conversation Header
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.clickable { }
                        ) {
                            Surface(
                                shape = CircleShape,
                                color = EmeraldLight.copy(alpha = 0.25f),
                                modifier = Modifier.size(38.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = activeThread!!.name.take(2).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 14.sp,
                                        color = Color.White
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = activeThread!!.name,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = Color.White
                                )
                                Text(
                                    text = if (activeThread!!.isOnline) "online • ${activeThread!!.roleBadge}" else activeThread!!.roleBadge,
                                    fontSize = 11.sp,
                                    color = EmeraldLight.copy(alpha = 0.85f)
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { activeThread = null }) {
                            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back", tint = Color.White)
                        }
                    },
                    actions = {
                        IconButton(onClick = {}) {
                            Icon(Icons.Rounded.Call, contentDescription = "Call", tint = Color.White)
                        }
                        IconButton(onClick = {}) {
                            Icon(Icons.Rounded.MoreVert, contentDescription = "Menu", tint = Color.White)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = ForestGreen
                    )
                )
            }
        },
        bottomBar = {
            if (activeThread != null) {
                // WhatsApp Style Input Pill & Mic / Send
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(MaterialTheme.colorScheme.background)
                        .navigationBarsPadding()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        modifier = Modifier.weight(1f),
                        shape = RoundedCornerShape(26.dp),
                        color = MaterialTheme.colorScheme.surface,
                        shadowElevation = 2.dp
                    ) {
                        Row(
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.SentimentSatisfied,
                                contentDescription = "Emoji",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(22.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            OutlinedTextField(
                                value = textInput,
                                onValueChange = { textInput = it },
                                placeholder = { Text("Message", fontSize = 15.sp) },
                                modifier = Modifier.weight(1f),
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = Color.Transparent,
                                    unfocusedBorderColor = Color.Transparent
                                ),
                                maxLines = 4
                            )
                            Icon(
                                imageVector = Icons.Rounded.AttachFile,
                                contentDescription = "Attach",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(20.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Icon(
                                imageVector = Icons.Rounded.CameraAlt,
                                contentDescription = "Camera",
                                tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }

                    Spacer(modifier = Modifier.width(6.dp))

                    // Floating Round Send / Mic Button
                    Surface(
                        modifier = Modifier
                            .size(48.dp)
                            .clickable {
                                if (textInput.isNotBlank()) {
                                    val newMsg = WhatsAppMessage(
                                        id = "m_${System.currentTimeMillis()}",
                                        content = textInput,
                                        time = "Just now",
                                        isOutgoing = true,
                                        isRead = false
                                    )
                                    messages = messages + newMsg
                                    textInput = ""
                                }
                            },
                        shape = CircleShape,
                        color = ForestGreen,
                        shadowElevation = 3.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = if (textInput.isNotBlank()) Icons.AutoMirrored.Rounded.Send else Icons.Rounded.Mic,
                                contentDescription = "Action",
                                tint = Color.White,
                                modifier = Modifier.size(22.dp)
                            )
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        if (activeThread == null) {
            // WhatsApp Threads List
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(MaterialTheme.colorScheme.background)
            ) {
                items(threads) { thread ->
                    WhatsAppThreadRow(
                        thread = thread,
                        onClick = { activeThread = thread }
                    )
                    HorizontalDivider(
                        modifier = Modifier.padding(start = 76.dp),
                        thickness = 0.5.dp,
                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f)
                    )
                }
            }
        } else {
            // WhatsApp Message History (Subtle WhatsApp doodle / soft tint background)
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
                    .background(MaterialTheme.colorScheme.background),
                contentPadding = PaddingValues(horizontal = 14.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Encryption disclaimer bubble
                item {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Surface(
                            shape = RoundedCornerShape(8.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.6f)
                        ) {
                            Text(
                                text = "🔒 Messages are end-to-end encrypted with clinic records.",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                items(messages) { msg ->
                    WhatsAppBubble(msg = msg)
                }
            }
        }
    }
}

@Composable
fun WhatsAppThreadRow(
    thread: WhatsAppChatThread,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        // Avatar with Online indicator
        Box {
            Surface(
                shape = CircleShape,
                color = ForestGreen.copy(alpha = 0.15f),
                modifier = Modifier.size(50.dp)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = thread.name.take(2).uppercase(),
                        fontWeight = FontWeight.Bold,
                        fontSize = 17.sp,
                        color = ForestGreen
                    )
                }
            }
            if (thread.isOnline) {
                Box(
                    modifier = Modifier
                        .size(13.dp)
                        .clip(CircleShape)
                        .background(EmeraldPrimary)
                        .align(Alignment.BottomEnd)
                )
            }
        }

        Spacer(modifier = Modifier.width(14.dp))

        Column(modifier = Modifier.weight(1f)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = thread.name,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onSurface,
                    maxLines = 1,
                    modifier = Modifier.weight(1f, fill = false)
                )
                Text(
                    text = thread.time,
                    fontSize = 12.sp,
                    color = if (thread.unreadCount > 0) EmeraldPrimary else MaterialTheme.colorScheme.onSurfaceVariant,
                    fontWeight = if (thread.unreadCount > 0) FontWeight.Bold else FontWeight.Normal
                )
            }

            Spacer(modifier = Modifier.height(3.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = thread.lastMessage,
                    fontSize = 13.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    modifier = Modifier.weight(1f)
                )

                if (thread.unreadCount > 0) {
                    Spacer(modifier = Modifier.width(6.dp))
                    Surface(
                        shape = CircleShape,
                        color = EmeraldPrimary,
                        modifier = Modifier.size(20.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "${thread.unreadCount}",
                                fontSize = 11.sp,
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

@Composable
fun WhatsAppBubble(msg: WhatsAppMessage) {
    val isMe = msg.isOutgoing

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 14.dp,
                topEnd = 14.dp,
                bottomStart = if (isMe) 14.dp else 2.dp,
                bottomEnd = if (isMe) 2.dp else 14.dp
            ),
            color = if (isMe) Color(0xFFE7FCE8) else MaterialTheme.colorScheme.surface, // WhatsApp Outgoing light green
            shadowElevation = 1.dp,
            modifier = Modifier.widthIn(max = 300.dp)
        ) {
            Column(modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)) {
                Text(
                    text = msg.content,
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                    color = Color(0xFF111B21)
                )
                Spacer(modifier = Modifier.height(2.dp))
                Row(
                    modifier = Modifier.align(Alignment.End),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = msg.time,
                        fontSize = 10.sp,
                        color = Color.Black.copy(alpha = 0.5f)
                    )
                    if (isMe) {
                        Spacer(modifier = Modifier.width(3.dp))
                        Icon(
                            imageVector = Icons.Rounded.DoneAll,
                            contentDescription = "Read",
                            tint = if (msg.isRead) Color(0xFF53BDEB) else Color.Gray,
                            modifier = Modifier.size(14.dp)
                        )
                    }
                }
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "WhatsApp Chat Light")
@Composable
fun ChatScreenPreview() {
    FMSTheme(darkTheme = false) {
        ChatScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "WhatsApp Chat Dark")
@Composable
fun ChatScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        ChatScreen()
    }
}
