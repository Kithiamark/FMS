package com.example.fms.ui.screens.admin

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

data class SupportTicketItem(
    val id: String,
    val ticketNumber: String,
    val farmName: String,
    val farmerName: String,
    val title: String,
    val description: String,
    val category: String, // M-Pesa Payment, AI Advisory, Device/IoT, General
    val priority: String, // URGENT, HIGH, NORMAL
    val status: String, // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    val createdAt: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminTicketsScreen(
    onBackClick: () -> Unit = {}
) {
    var selectedFilter by remember { mutableStateOf("ALL") }
    var selectedTicketForReply by remember { mutableStateOf<SupportTicketItem?>(null) }
    var replyText by remember { mutableStateOf("") }
    var resolutionStatus by remember { mutableStateOf("RESOLVED") }

    var tickets by remember {
        mutableStateOf(
            listOf(
                SupportTicketItem(
                    id = "t_101",
                    ticketNumber = "#TK-8021",
                    farmName = "Baraka Dairy Farm",
                    farmerName = "Mark Kipkorir",
                    title = "M-Pesa Paybill confirmation delay for Enterprise tier",
                    description = "Paid KES 5,000 to Paybill 522533 Acc 1349921815. M-Pesa code QHJ8291KLS. Please activate multi-worker chore module.",
                    category = "M-Pesa Payment",
                    priority = "URGENT",
                    status = "OPEN",
                    createdAt = "25 mins ago"
                ),
                SupportTicketItem(
                    id = "t_102",
                    ticketNumber = "#TK-8019",
                    farmName = "Highland Pastures",
                    farmerName = "Faith Chepkemoi",
                    title = "Cooler temperature alert webhook trigger failure",
                    description = "Chilling tank temp sensor alert was delayed by 40 minutes during Friday night power surge.",
                    category = "Device/IoT",
                    priority = "HIGH",
                    status = "IN_PROGRESS",
                    createdAt = "2 hours ago"
                ),
                SupportTicketItem(
                    id = "t_103",
                    ticketNumber = "#TK-8015",
                    farmName = "Kiprono Meadow Ranch",
                    farmerName = "David Kiprono",
                    title = "Linear regression milk projection variance request",
                    description = "Requested recalibration of yield prediction model following introduction of 16% dairy meal concentrate.",
                    category = "AI Advisory",
                    priority = "NORMAL",
                    status = "RESOLVED",
                    createdAt = "Yesterday"
                )
            )
        )
    }

    val filteredTickets = tickets.filter {
        if (selectedFilter == "ALL") true else it.status == selectedFilter
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Admin Support & Disputes",
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                        Text(
                            text = "System Triage & Farmer Inquiries (${tickets.size} tickets)",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.ArrowBack,
                            contentDescription = "Back",
                            tint = MaterialTheme.colorScheme.onSurface
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(innerPadding),
            contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 8.dp, bottom = 120.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Status Filter Chips
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        val filters = listOf(
                            "ALL" to "All",
                            "OPEN" to "Open",
                            "IN_PROGRESS" to "In Progress",
                            "RESOLVED" to "Resolved"
                        )
                        items(filters) { (code, label) ->
                            val isSelected = selectedFilter == code
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedFilter = code },
                                label = { Text(label, fontSize = 12.sp, fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal) },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                    selectedLabelColor = EmeraldPrimary
                                )
                            )
                        }
                    }

                    Text(
                        text = "${filteredTickets.size} tickets",
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Ticket Cards List
            if (filteredTickets.isEmpty()) {
                item {
                    IslandCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(36.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.ConfirmationNumber,
                                contentDescription = null,
                                tint = EmeraldPrimary,
                                modifier = Modifier.size(44.dp)
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No tickets in this category",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp
                            )
                            Text(
                                text = "All farmer inquiries in this filter have been handled.",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            } else {
                items(filteredTickets, key = { it.id }) { ticket ->
                    val isUrgent = ticket.priority == "URGENT"
                    val isResolved = ticket.status == "RESOLVED"

                    IslandCard {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { selectedTicketForReply = ticket }
                                .padding(16.dp)
                        ) {
                            // Header: Ticket number & Priority
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Text(
                                        text = ticket.ticketNumber,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = EmeraldPrimary
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "• ${ticket.category}",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                PillBadge(
                                    text = ticket.priority,
                                    color = if (isUrgent) RoseRed else if (ticket.priority == "HIGH") GoldAmber else SkyBlue,
                                    backgroundColor = if (isUrgent) RoseLight else if (ticket.priority == "HIGH") AmberLight else BlueLight
                                )
                            }

                            Spacer(modifier = Modifier.height(6.dp))

                            // Title & Description
                            Text(
                                text = ticket.title,
                                fontWeight = FontWeight.Bold,
                                fontSize = 15.sp,
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = ticket.description,
                                fontSize = 13.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                                lineHeight = 17.sp
                            )

                            Spacer(modifier = Modifier.height(12.dp))

                            // Metadata & Status
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(
                                        imageVector = Icons.Rounded.Person,
                                        contentDescription = null,
                                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                                        modifier = Modifier.size(13.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text(
                                        text = "${ticket.farmerName} (${ticket.farmName})",
                                        fontSize = 11.sp,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }

                                PillBadge(
                                    text = ticket.status.replace("_", " "),
                                    color = if (isResolved) EmeraldPrimary else SkyBlue,
                                    backgroundColor = if (isResolved) EmeraldLight else BlueLight
                                )
                            }
                        }
                    }
                }
            }
        }
    }

    // Modal: Reply & Resolve Ticket
    if (selectedTicketForReply != null) {
        val ticket = selectedTicketForReply!!
        IslandModal(
            isOpen = selectedTicketForReply != null,
            onDismissRequest = { selectedTicketForReply = null },
            title = "Ticket ${ticket.ticketNumber}",
            icon = Icons.Rounded.SupportAgent,
            badgeText = "ADMIN RESOLUTION",
            confirmButton = {
                Button(
                    onClick = {
                        tickets = tickets.map {
                            if (it.id == ticket.id) it.copy(status = resolutionStatus) else it
                        }
                        replyText = ""
                        selectedTicketForReply = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Submit Reply & Update", fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { selectedTicketForReply = null },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Cancel")
                }
            }
        ) {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Ticket summary
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(10.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                        .padding(12.dp)
                ) {
                    Column {
                        Text(
                            text = ticket.title,
                            fontWeight = FontWeight.Bold,
                            fontSize = 13.sp,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Spacer(modifier = Modifier.height(2.dp))
                        Text(
                            text = "Farmer: ${ticket.farmerName} • Farm: ${ticket.farmName}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                // Reply message input
                OutlinedTextField(
                    value = replyText,
                    onValueChange = { replyText = it },
                    label = { Text("Resolution Reply to Farmer") },
                    placeholder = { Text("e.g. M-Pesa transaction confirmed and Enterprise tier activated...") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    shape = RoundedCornerShape(12.dp)
                )

                // Update Status Chips
                Text(
                    text = "Update Ticket Status",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    listOf("IN_PROGRESS", "RESOLVED", "CLOSED").forEach { st ->
                        val isSel = resolutionStatus == st
                        FilterChip(
                            selected = isSel,
                            onClick = { resolutionStatus = st },
                            label = { Text(st.replace("_", " "), fontSize = 11.sp) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                selectedLabelColor = EmeraldPrimary
                            )
                        )
                    }
                }
            }
        }
    }
}

@Preview(name = "AdminTicketsScreen Light", showBackground = true)
@Composable
fun AdminTicketsScreenLightPreview() {
    FMSTheme(darkTheme = false) {
        AdminTicketsScreen()
    }
}

@Preview(name = "AdminTicketsScreen Dark", showBackground = true)
@Composable
fun AdminTicketsScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        AdminTicketsScreen()
    }
}
