package com.example.fms.ui.screens.farmer.herd

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.CattleRecord
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AnimalDetailScreen(
    cow: CattleRecord = CattleRecord("1", "#104", "Bessie", "Friesian", "Healthy", 25.5),
    onBackClick: () -> Unit = {},
    onLogMedicalEvent: () -> Unit = {}
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Animal Passport",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.AutoMirrored.Rounded.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = {}) {
                        Icon(Icons.Rounded.QrCode, contentDescription = "View QR", tint = EmeraldPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background)
            )
        }
    ) { innerPadding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Cow Passport Inset Group
            item {
                InsetGroup(
                    header = "Animal Identity & Passport",
                    footer = "Registered with Kenya Veterinary Board tracking system."
                ) {
                    InsetRow(
                        title = "${cow.name} (${cow.tagNumber})",
                        subtitle = "${cow.breed} • Age: 3.5 Yrs • Weight: 520 kg",
                        leadingIcon = com.example.fms.ui.theme.CowIcon,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        trailingBadge = cow.healthStatus,
                        badgeColor = if (cow.healthStatus == "Healthy") EmeraldPrimary else RoseRed,
                        showChevron = false
                    )
                    InsetRow(
                        title = "Daily Yield Average",
                        subtitle = "Calculated over last 30 milking sessions",
                        leadingIcon = Icons.Rounded.WaterDrop,
                        trailingText = "${cow.dailyAvgYield} L/day",
                        showChevron = false
                    )
                    InsetRow(
                        title = "Lactation Cycle",
                        subtitle = "2nd Lactation • Calved 4 months ago",
                        leadingIcon = Icons.Rounded.Timeline,
                        iconTint = GoldAmber,
                        iconBackgroundColor = GoldAmber.copy(alpha = 0.12f),
                        trailingBadge = "Active Lactation",
                        badgeColor = ForestGreen,
                        showChevron = false,
                        showDivider = false
                    )
                }
            }

            // Health & Medical Records Inset Group
            item {
                InsetGroup(
                    header = "Medical & Vaccination Timeline",
                    footer = "Certified veterinary treatments entered by attending DVM surgeon."
                ) {
                    InsetRow(
                        title = "Foot & Mouth Booster Vaccine",
                        subtitle = "Oct 12, 2026 • By Dr. Kiprono (DVM)",
                        leadingIcon = Icons.Rounded.Vaccines,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        trailingBadge = "Verified",
                        badgeColor = EmeraldPrimary,
                        showChevron = true
                    )
                    InsetRow(
                        title = "Quarter Teat Cleaning & Dip",
                        subtitle = "Sep 28, 2026 • Barn Ops Routine",
                        leadingIcon = Icons.Rounded.Sanitizer,
                        iconTint = SkyBlue,
                        iconBackgroundColor = SkyBlue.copy(alpha = 0.12f),
                        trailingBadge = "Completed",
                        badgeColor = SkyBlue,
                        showChevron = true
                    )
                    InsetRow(
                        title = "Log Medical Event / Request Visit",
                        subtitle = "Request attending vet checkup for ${cow.name}",
                        leadingIcon = Icons.Rounded.AddCircleOutline,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = onLogMedicalEvent
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(30.dp))
            }
        }
    }
}

@Composable
fun PassportMetric(label: String, value: String, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = value, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = color)
        Spacer(modifier = Modifier.height(2.dp))
        Text(text = label, fontSize = 10.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
    }
}

@Composable
fun MedicalTimelineItem(
    title: String,
    date: String,
    doctor: String,
    status: String,
    statusColor: Color
) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Spacer(modifier = Modifier.height(2.dp))
                Text(text = "$date • By $doctor", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
            PillBadge(
                text = status,
                containerColor = statusColor.copy(alpha = 0.15f),
                contentColor = statusColor
            )
        }
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Animal Detail Light")
@Composable
fun AnimalDetailScreenPreview() {
    FMSTheme(darkTheme = false) {
        AnimalDetailScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Animal Detail Dark")
@Composable
fun AnimalDetailScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        AnimalDetailScreen()
    }
}
