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
import com.example.fms.ui.components.IslandCard
import com.example.fms.ui.components.PillBadge
import com.example.fms.ui.theme.*

data class ChatMessage(
    val id: String,
    val senderName: String,
    val content: String,
    val timestamp: String,
    val isFromMe: Boolean
)

data class ConversationSummary(
    val id: String,
    val participantName: String,
    val participantRole: String,
    val lastMessage: String,
    val time: String,
    val unreadCount: Int = 0
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatScreen(
    initialRecipient: String? = null,
    onBackClick: () -> Unit = {}
) {
    var activeConversation by remember {
        mutableStateOf(
            if (initialRecipient != null) {
                ConversationSummary(
                    id = "c_active",
                    participantName = initialRecipient,
                    participantRole = "Veterinarian",
                    lastMessage = "Let's connect on WhatsApp or call.",
                    time = "Just now"
                )
            } else null
        )
    }

    var messageText by remember { mutableStateOf("") }

    var messages by remember {
        mutableStateOf(
            listOf(
                ChatMessage("m1", "Dr. Emmanuel Kiprono", "Hello Baraka, received your inquiry regarding Cow #104's mastitis symptoms.", "10:14 AM", false),
                ChatMessage("m2", "You", "Thanks Doctor. Yield dropped from 18L to 11L this morning, with mild swelling in rear right quarter.", "10:16 AM", true),
                ChatMessage("m3", "Dr. Emmanuel Kiprono", "Understood. Please isolate her milk immediately and do not mix with cooperative batches. I will arrive around 2:00 PM with intramammary infusion tubes.", "10:18 AM", false)
            )
        )
    }

    val conversationList = remember {
        listOf(
            ConversationSummary("1", "Dr. Emmanuel Kiprono", "Veterinarian", "I will arrive around 2:00 PM with tubes.", "10:18 AM", 1),
            ConversationSummary("2", "Faith Chepkemoi", "Chepkemoi Hill Farm", "Can you dispatch the pickup truck?", "Yesterday", 0),
            ConversationSummary("3", "Eldoret Bulk Cooler Depot", "Milk Aggregator", "Batch #B-104 Lactometer verified: 29.5", "Oct 18", 0)
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    if (activeConversation != null) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Surface(
                                shape = CircleShape,
                                color = EmeraldPrimary.copy(alpha = 0.15f),
                                modifier = Modifier.size(36.dp)
                            ) {
                                Box(contentAlignment = Alignment.Center) {
                                    Text(
                                        text = activeConversation!!.participantName.take(2).uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        color = EmeraldPrimary
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column {
                                Text(
                                    text = activeConversation!!.participantName,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(
                                    text = "${activeConversation!!.participantRole} • Online",
                                    fontSize = 11.sp,
                                    color = EmeraldPrimary
                                )
                            }
                        }
                    } else {
                        Column {
                            Text(
                                text = "Direct Messages",
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                            Text(
                                text = "Vets, Aggregators & Farmers",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                },
                navigationIcon = {
                    if (activeConversation != null) {
                        IconButton(onClick = { activeConversation = null }) {
                            Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back to list")
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        },
        bottomBar = {
            if (activeConversation != null) {
                Surface(
                    modifier = Modifier
                        .fillMaxWidth()
                        .navigationBarsPadding(),
                    shadowElevation = 8.dp,
                    color = MaterialTheme.colorScheme.surface
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedTextField(
                            value = messageText,
                            onValueChange = { messageText = it },
                            placeholder = { Text("Write a message...") },
                            modifier = Modifier
                                .weight(1f)
                                .heightIn(max = 120.dp),
                            shape = RoundedCornerShape(20.dp),
                            maxLines = 4
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        IconButton(
                            onClick = {
                                if (messageText.isNotBlank()) {
                                    val newMsg = ChatMessage(
                                        id = "m_${System.currentTimeMillis()}",
                                        senderName = "You",
                                        content = messageText,
                                        timestamp = "Just now",
                                        isFromMe = true
                                    )
                                    messages = messages + newMsg
                                    messageText = ""
                                }
                            },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(CircleShape)
                                .background(EmeraldPrimary)
                        ) {
                            Icon(Icons.AutoMirrored.Rounded.Send, contentDescription = "Send", tint = Color.White)
                        }
                    }
                }
            }
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            if (activeConversation == null) {
                // List of conversations
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(conversationList) { conv ->
                        ConversationItemCard(
                            conversation = conv,
                            onClick = { activeConversation = conv }
                        )
                    }
                }
            } else {
                // Active chat thread
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 16.dp),
                    contentPadding = PaddingValues(vertical = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(messages) { msg ->
                        ChatBubbleItem(message = msg)
                    }
                }
            }
        }
    }
}

@Composable
fun ConversationItemCard(
    conversation: ConversationSummary,
    onClick: () -> Unit
) {
    IslandCard(
        modifier = Modifier.fillMaxWidth(),
        elevation = 2.dp,
        onClick = onClick
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.weight(1f)) {
                Surface(
                    shape = CircleShape,
                    color = EmeraldPrimary.copy(alpha = 0.15f),
                    modifier = Modifier.size(44.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Text(
                            text = conversation.participantName.take(2).uppercase(),
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = EmeraldPrimary
                        )
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = conversation.participantName,
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        PillBadge(
                            text = conversation.participantRole,
                            containerColor = MaterialTheme.colorScheme.surfaceVariant,
                            contentColor = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Spacer(modifier = Modifier.height(3.dp))
                    Text(
                        text = conversation.lastMessage,
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1
                    )
                }
            }

            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = conversation.time,
                    fontSize = 11.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (conversation.unreadCount > 0) {
                    Spacer(modifier = Modifier.height(4.dp))
                    Surface(
                        shape = CircleShape,
                        color = EmeraldPrimary,
                        modifier = Modifier.size(20.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text(
                                text = "${conversation.unreadCount}",
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
fun ChatBubbleItem(message: ChatMessage) {
    val isMe = message.isFromMe

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = if (isMe) Alignment.End else Alignment.Start
    ) {
        Surface(
            shape = RoundedCornerShape(
                topStart = 18.dp,
                topEnd = 18.dp,
                bottomStart = if (isMe) 18.dp else 4.dp,
                bottomEnd = if (isMe) 4.dp else 18.dp
            ),
            color = if (isMe) EmeraldPrimary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.7f),
            shadowElevation = 1.dp,
            modifier = Modifier.widthIn(max = 280.dp)
        ) {
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = message.content,
                    fontSize = 14.sp,
                    lineHeight = 19.sp,
                    color = if (isMe) Color.White else MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = message.timestamp,
                    fontSize = 10.sp,
                    fontWeight = FontWeight.Medium,
                    color = if (isMe) Color.White.copy(alpha = 0.7f) else MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.align(Alignment.End)
                )
            }
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Chat Screen Light")
@Composable
fun ChatScreenPreview() {
    FMSTheme(darkTheme = false) {
        ChatScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Chat Screen Dark")
@Composable
fun ChatScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        ChatScreen()
    }
}
