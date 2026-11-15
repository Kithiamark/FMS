package com.example.fms.ui.screens.settings

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.rounded.ArrowBack
import androidx.compose.material.icons.automirrored.rounded.Logout
import androidx.compose.material.icons.automirrored.rounded.OpenInNew
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.foundation.lazy.items
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.SavedMediaItem
import com.example.fms.data.model.SubscriptionTier
import com.example.fms.data.model.UserRole
import com.example.fms.ui.components.buttons.IslandButton
import com.example.fms.ui.components.cards.IslandCard
import com.example.fms.ui.components.common.InsetGroup
import com.example.fms.ui.components.common.InsetRow
import com.example.fms.ui.components.common.PillBadge
import com.example.fms.ui.components.modals.IslandModal
import com.example.fms.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentRole: UserRole = UserRole.FARMER,
    onRoleChanged: (UserRole) -> Unit = {},
    onLogoutClick: () -> Unit = {}
) {
    val context = LocalContext.current
    var isBiometricsEnabled by remember { mutableStateOf(true) }
    var isOfflineSyncEnabled by remember { mutableStateOf(true) }
    var isPushAlertsEnabled by remember { mutableStateOf(true) }
    var showLogoutDialog by remember { mutableStateOf(false) }

    // User Profile & Interaction States
    var userFullName by remember { mutableStateOf("Baraka Mark") }
    var farmName by remember { mutableStateOf("Baraka Farm") }
    var username by remember { mutableStateOf("baraka_farm") }
    var userBio by remember { mutableStateOf("Commercial Dairy Operator • 24 Friesians & Ayrshires") }
    var userPhone by remember { mutableStateOf("+254 712 345 678") }
    var currentPlan by remember { mutableStateOf(SubscriptionTier.ENTERPRISE) }
    var indemnityPolicy by remember { mutableStateOf("APA-AGRI-2026-9812") }
    var indemnityProvider by remember { mutableStateOf("APA Insurance") }
    var indemnityCoverage by remember { mutableStateOf("2,500,000") }
    var indemnityExpiry by remember { mutableStateOf("31 Dec 2026") }
    var indemnityStatus by remember { mutableStateOf("ACTIVE") }

    var showEditProfileModal by remember { mutableStateOf(false) }
    var showEditUsernameModal by remember { mutableStateOf(false) }
    var showSubmitIndemnityModal by remember { mutableStateOf(false) }
    var showLikedSheet by remember { mutableStateOf(false) }
    var showRepostsSheet by remember { mutableStateOf(false) }
    var showBookmarksSheet by remember { mutableStateOf(false) }

    val likedItems = remember {
        listOf(
            SavedMediaItem("l1", "TMR Feed Mixing Demonstration", "Dr. Omondi (Vet)", "@omondi_vet", "2d ago", "VIDEO", "Watch the correct ratio of silage to Rhodes grass for high-producing Friesians."),
            SavedMediaItem("l2", "Silage Pit Sealing Best Practices", "Kiprono Dairy", "@kiprono_dairy", "3d ago", "POST", "Double layer plastic sheeting with spent tyres prevents mold spoilage."),
            SavedMediaItem("l3", "Managing Milk Fever in Transition Cows", "Kenya Dairy Hub", "@dairy_hub_ke", "5d ago", "VIDEO", "Pre-calving calcium negative balance protocol explained step by step.")
        )
    }
    val repostedItems = remember {
        listOf(
            SavedMediaItem("r1", "Cooperative Bulk Pricing for Q4", "Meru Dairy Union", "@meru_dairy", "1w ago", "POST", "Farm-gate raw milk pickup rate increased to 52 KES/L starting this Friday."),
            SavedMediaItem("r2", "Automatic Cluster Washers Maintenance", "Wanjiku Machine Tech", "@wanjiku_tech", "2w ago", "POST", "Acid vs alkali sanitization sequence for parlor pipelines.")
        )
    }
    val bookmarkedItems = remember {
        listOf(
            SavedMediaItem("b1", "Clinical Drug Withdrawal Timetable", "Dr. Jane Mwangi (KVB)", "@dr_jane_vet", "4d ago", "GUIDE", "Essential withdrawal days for Oxytetracycline, Penicillin & Tylosin."),
            SavedMediaItem("b2", "Calf Weaning Weight & Starter Intake", "Livestock Board", "@livestock_ke", "1w ago", "GUIDE", "Wean calves only after 1kg/day starter feed intake for 3 consecutive days.")
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Settings & Profile",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Preferences, Security & Offline",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
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
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, top = 8.dp, bottom = 110.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Interactive User Profile Island
            item {
                IslandCard(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = 4.dp
                ) {
                    // Clickable Profile Header Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { showEditProfileModal = true }
                            .padding(2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Surface(
                            shape = CircleShape,
                            color = ForestGreen,
                            modifier = Modifier.size(56.dp)
                        ) {
                            Box(contentAlignment = Alignment.Center) {
                                val initials = userFullName.split(" ")
                                    .mapNotNull { it.firstOrNull() }
                                    .take(2)
                                    .joinToString("")
                                Text(
                                    text = if (initials.isNotEmpty()) initials else "BM",
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Black,
                                    color = EmeraldLight
                                )
                            }
                        }

                        Spacer(modifier = Modifier.width(14.dp))

                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = userFullName,
                                    fontSize = 17.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = MaterialTheme.colorScheme.onSurface
                                )
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(10.dp),
                                    color = EmeraldPrimary.copy(alpha = 0.12f),
                                    modifier = Modifier.clickable { showEditUsernameModal = true }
                                ) {
                                    Text(
                                        text = "@$username",
                                        color = EmeraldPrimary,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = "$userPhone • $farmName",
                                fontSize = 12.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                                PillBadge(
                                    text = currentRole.title,
                                    containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                                    contentColor = EmeraldPrimary
                                )
                                PillBadge(
                                    text = currentPlan.title,
                                    containerColor = if (currentPlan == SubscriptionTier.ENTERPRISE) EmeraldLight else GoldAmber.copy(alpha = 0.2f),
                                    contentColor = if (currentPlan == SubscriptionTier.ENTERPRISE) ForestGreen else GoldAmber
                                )
                            }
                        }

                        Icon(
                            imageVector = Icons.Rounded.Edit,
                            contentDescription = "Edit Profile",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f),
                            modifier = Modifier.size(18.dp)
                        )
                    }

                    Spacer(modifier = Modifier.height(14.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))
                    Spacer(modifier = Modifier.height(12.dp))

                    // Clickable Social Activity Metrics (Likes, Reposts, Bookmarks)
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceAround,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .clickable { showLikedSheet = true }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Rounded.Favorite, contentDescription = null, tint = RoseRed, modifier = Modifier.size(15.dp))
                                Text("${likedItems.size + 245}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text("Likes", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .clickable { showRepostsSheet = true }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Rounded.Repeat, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(15.dp))
                                Text("${repostedItems.size + 84}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text("Reposts", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }

                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier
                                .clip(RoundedCornerShape(12.dp))
                                .clickable { showBookmarksSheet = true }
                                .padding(horizontal = 12.dp, vertical = 6.dp)
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                                Icon(Icons.Rounded.Bookmark, contentDescription = null, tint = SkyBlue, modifier = Modifier.size(15.dp))
                                Text("${bookmarkedItems.size + 40}", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                            Text("Bookmarks", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.25f))
                    Spacer(modifier = Modifier.height(10.dp))

                    // Clickable Professional Indemnity / Policy Row
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(12.dp))
                            .clickable { showSubmitIndemnityModal = true }
                            .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.45f))
                            .padding(horizontal = 12.dp, vertical = 9.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Icon(Icons.Rounded.Shield, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(18.dp))
                            Column {
                                Text("Professional Indemnity & Insurance", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                Text("$indemnityProvider • $indemnityPolicy ($indemnityStatus)", fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            }
                        }
                        Text("Submit / Edit", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = EmeraldPrimary)
                    }
                }
            }

            // Plan & Quota Management Inset Group (Basic vs Enterprise)
            item {
                InsetGroup(
                    header = "Subscription & Limits",
                    footer = "Enterprise tier unlocks multi-barn aggregation, unlimited cattle tags, and veterinary AI predictive diagnostics."
                ) {
                    InsetRow(
                        title = currentPlan.title,
                        subtitle = currentPlan.subtitle,
                        leadingIcon = Icons.Rounded.WorkspacePremium,
                        iconTint = if (currentPlan == SubscriptionTier.ENTERPRISE) EmeraldPrimary else GoldAmber,
                        iconBackgroundColor = if (currentPlan == SubscriptionTier.ENTERPRISE) EmeraldPrimary.copy(alpha = 0.12f) else GoldAmber.copy(alpha = 0.12f),
                        trailingBadge = if (currentPlan == SubscriptionTier.ENTERPRISE) "ACTIVE" else "BASIC",
                        badgeColor = if (currentPlan == SubscriptionTier.ENTERPRISE) EmeraldPrimary else GoldAmber,
                        showChevron = true,
                        showDivider = false,
                        onClick = {
                            currentPlan = if (currentPlan == SubscriptionTier.ENTERPRISE) SubscriptionTier.BASIC else SubscriptionTier.ENTERPRISE
                        }
                    )
                }
            }

            // Role Switcher Inset Group (Allows instant persona change)
            item {
                InsetGroup(
                    header = "Active User Persona",
                    footer = "Switch persona to view the operational dashboard tailored to that role."
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        UserRole.entries.forEach { role ->
                            val isSelected = currentRole == role
                            Surface(
                                modifier = Modifier
                                    .weight(1f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .clickable { onRoleChanged(role) },
                                color = if (isSelected) EmeraldPrimary else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                            ) {
                                Column(
                                    modifier = Modifier.padding(vertical = 10.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(
                                        text = when (role) {
                                            UserRole.FARMER -> "Farmer"
                                            UserRole.FARM_WORKER -> "Worker"
                                            UserRole.VETERINARIAN -> "Vet"
                                            UserRole.AGGREGATOR -> "Buyer"
                                            UserRole.ADMIN -> "Admin"
                                        },
                                        fontSize = 12.sp,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                                        color = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface
                                    )
                                }
                            }
                        }
                    }
                }
            }


            // Security & Hardware Settings Inset Group
            item {
                InsetGroup(
                    header = "Security & Synchronization",
                    footer = "Offline records synchronize automatically when cellular or Wi-Fi data connects."
                ) {
                    InsetRow(
                        title = "Biometric Lock",
                        subtitle = "Require fingerprint or face unlock",
                        leadingIcon = Icons.Rounded.Fingerprint,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        showChevron = false,
                        trailingContent = {
                            Switch(
                                checked = isBiometricsEnabled,
                                onCheckedChange = { isBiometricsEnabled = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = EmeraldPrimary
                                )
                            )
                        }
                    )
                    InsetRow(
                        title = "Auto Background Sync",
                        subtitle = "Sync offline barn records seamlessly",
                        leadingIcon = Icons.Rounded.CloudSync,
                        iconTint = SkyBlue,
                        iconBackgroundColor = SkyBlue.copy(alpha = 0.12f),
                        showChevron = false,
                        trailingContent = {
                            Switch(
                                checked = isOfflineSyncEnabled,
                                onCheckedChange = { isOfflineSyncEnabled = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = EmeraldPrimary
                                )
                            )
                        }
                    )
                    InsetRow(
                        title = "Mastitis & Calving Alerts",
                        subtitle = "Instant high-priority notifications",
                        leadingIcon = Icons.Rounded.NotificationsActive,
                        iconTint = GoldAmber,
                        iconBackgroundColor = GoldAmber.copy(alpha = 0.12f),
                        showChevron = false,
                        showDivider = false,
                        trailingContent = {
                            Switch(
                                checked = isPushAlertsEnabled,
                                onCheckedChange = { isPushAlertsEnabled = it },
                                colors = SwitchDefaults.colors(
                                    checkedThumbColor = Color.White,
                                    checkedTrackColor = EmeraldPrimary
                                )
                            )
                        }
                    )
                }
            }

            // Web Portal & Billing Inset Group
            item {
                InsetGroup(
                    header = "Web Portal & Billing",
                    footer = "Manage farm workers, payroll, billing, and tax exports on the desktop web app."
                ) {
                    InsetRow(
                        title = "Advanced Farm Account Settings",
                        subtitle = "Manage workers, billing & reports on web",
                        leadingIcon = Icons.Rounded.AdminPanelSettings,
                        iconTint = EmeraldPrimary,
                        iconBackgroundColor = EmeraldPrimary.copy(alpha = 0.12f),
                        showChevron = true,
                        showDivider = false,
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://fms-dairy.onrender.com/settings"))
                            context.startActivity(intent)
                        }
                    )
                }
            }

            // Logout Button
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Button(
                    onClick = { showLogoutDialog = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = RoseRed.copy(alpha = 0.12f),
                        contentColor = RoseRed
                    )
                ) {
                    Icon(Icons.AutoMirrored.Rounded.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Sign Out of Account", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                }
            }

            item {
                Spacer(modifier = Modifier.height(24.dp))
            }
        }
    }

    if (showLogoutDialog) {
        ModalBottomSheet(
            onDismissRequest = { showLogoutDialog = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .width(36.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Surface(
                    shape = CircleShape,
                    color = RoseRed.copy(alpha = 0.15f),
                    modifier = Modifier.size(56.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Rounded.Logout,
                            contentDescription = null,
                            tint = RoseRed,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }

                Text(
                    text = "Sign Out of Account?",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onSurface
                )

                Text(
                    text = "Are you sure you want to sign out? You will need to verify via password or OTP upon logging back in.",
                    fontSize = 13.sp,
                    lineHeight = 18.sp,
                    textAlign = TextAlign.Center,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showLogoutDialog = false },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            showLogoutDialog = false
                            onLogoutClick()
                        },
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = RoseRed),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Log Out", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // --- 1. EDIT PROFILE BOTTOM SHEET ---
    if (showEditProfileModal) {
        var draftName by remember { mutableStateOf(userFullName) }
        var draftFarm by remember { mutableStateOf(farmName) }
        var draftPhone by remember { mutableStateOf(userPhone) }
        var draftBio by remember { mutableStateOf(userBio) }

        ModalBottomSheet(
            onDismissRequest = { showEditProfileModal = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .width(36.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Edit Profile Details",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Update Name, Farm & Contact Information",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "PROFILE",
                        containerColor = EmeraldPrimary.copy(alpha = 0.15f),
                        contentColor = EmeraldPrimary
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                OutlinedTextField(
                    value = draftName,
                    onValueChange = { draftName = it },
                    label = { Text("Full Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                OutlinedTextField(
                    value = draftFarm,
                    onValueChange = { draftFarm = it },
                    label = { Text("Farm / Practice Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                OutlinedTextField(
                    value = draftPhone,
                    onValueChange = { draftPhone = it },
                    label = { Text("Contact Phone") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                OutlinedTextField(
                    value = draftBio,
                    onValueChange = { draftBio = it },
                    label = { Text("Bio / Operational Summary") },
                    maxLines = 3,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showEditProfileModal = false },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            userFullName = draftName.trim()
                            farmName = draftFarm.trim()
                            userPhone = draftPhone.trim()
                            userBio = draftBio.trim()
                            showEditProfileModal = false
                        },
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Changes", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // --- 2. EDIT USERNAME BOTTOM SHEET ---
    if (showEditUsernameModal) {
        var draftUsername by remember { mutableStateOf(username) }
        var usernameError by remember { mutableStateOf<String?>(null) }

        ModalBottomSheet(
            onDismissRequest = { showEditUsernameModal = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .width(36.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Edit Unique Handle",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Identity, Tags & Deep Links",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "IDENTITY",
                        containerColor = SkyBlue.copy(alpha = 0.15f),
                        contentColor = SkyBlue
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                Text(
                    text = "Your unique handle is used for community posts, peer tags, and sharing via deep links.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                OutlinedTextField(
                    value = draftUsername,
                    onValueChange = {
                        draftUsername = it
                        usernameError = null
                    },
                    label = { Text("Username") },
                    prefix = { Text("@", fontWeight = FontWeight.Bold) },
                    singleLine = true,
                    isError = usernameError != null,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                if (usernameError != null) {
                    Text(
                        text = usernameError ?: "",
                        color = MaterialTheme.colorScheme.error,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showEditUsernameModal = false },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            val clean = draftUsername.removePrefix("@").trim()
                            if (clean.length < 3) {
                                usernameError = "Username must be at least 3 characters."
                            } else if (!clean.matches(Regex("^[a-zA-Z0-9_]+$"))) {
                                usernameError = "Only letters, numbers, and underscores allowed."
                            } else {
                                username = clean.lowercase()
                                showEditUsernameModal = false
                            }
                        },
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Save Handle", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // --- 3. SUBMIT INDEMNITY BOTTOM SHEET ---
    if (showSubmitIndemnityModal) {
        var draftProvider by remember { mutableStateOf(indemnityProvider) }
        var draftPolicy by remember { mutableStateOf(indemnityPolicy) }
        var draftCoverage by remember { mutableStateOf(indemnityCoverage) }
        var draftExpiry by remember { mutableStateOf(indemnityExpiry) }

        ModalBottomSheet(
            onDismissRequest = { showSubmitIndemnityModal = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
            dragHandle = {
                Box(
                    modifier = Modifier
                        .padding(top = 10.dp, bottom = 6.dp)
                        .width(36.dp)
                        .height(5.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
                )
            }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 12.dp)
                    .navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Professional Indemnity",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "Statutory Compliance & Liability Cover",
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    PillBadge(
                        text = "COMPLIANCE",
                        containerColor = ForestGreen.copy(alpha = 0.15f),
                        contentColor = ForestGreen
                    )
                }

                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.35f))

                Text(
                    text = "Provide your active agricultural / veterinary indemnity insurance details for platform compliance and verified status.",
                    fontSize = 12.sp,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Column {
                    Text("Insurance Provider", fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                    Spacer(modifier = Modifier.height(4.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        listOf("APA Insurance", "CIC Group", "Britam", "Jubilee").forEach { prov ->
                            FilterChip(
                                selected = draftProvider == prov,
                                onClick = { draftProvider = prov },
                                label = { Text(prov, fontSize = 11.sp) },
                                shape = RoundedCornerShape(14.dp),
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = EmeraldPrimary.copy(alpha = 0.2f),
                                    selectedLabelColor = EmeraldPrimary
                                )
                            )
                        }
                    }
                }

                OutlinedTextField(
                    value = draftPolicy,
                    onValueChange = { draftPolicy = it },
                    label = { Text("Policy Number *") },
                    placeholder = { Text("e.g. APA-AGRI-2026-9812") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                OutlinedTextField(
                    value = draftCoverage,
                    onValueChange = { draftCoverage = it },
                    label = { Text("Coverage Limit (KES)") },
                    placeholder = { Text("e.g. 2,500,000") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                OutlinedTextField(
                    value = draftExpiry,
                    onValueChange = { draftExpiry = it },
                    label = { Text("Policy Expiry Date") },
                    placeholder = { Text("e.g. 31 Dec 2026") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = EmeraldPrimary,
                        cursorColor = EmeraldPrimary
                    )
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedButton(
                        onClick = { showSubmitIndemnityModal = false },
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            indemnityProvider = draftProvider
                            indemnityPolicy = draftPolicy.trim()
                            indemnityCoverage = draftCoverage.trim()
                            indemnityExpiry = draftExpiry.trim()
                            indemnityStatus = "ACTIVE"
                            showSubmitIndemnityModal = false
                        },
                        modifier = Modifier.weight(1.5f).height(48.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = EmeraldPrimary),
                        shape = RoundedCornerShape(14.dp)
                    ) {
                        Icon(Icons.Rounded.Check, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Submit Policy", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }

    // --- 4. LIKED MEDIA BOTTOM SHEET ---
    if (showLikedSheet) {
        ModalBottomSheet(
            onDismissRequest = { showLikedSheet = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f)
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Rounded.Favorite, contentDescription = null, tint = RoseRed, modifier = Modifier.size(20.dp))
                        Text("Liked Posts & Videos (${likedItems.size})", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    }
                    IconButton(onClick = { showLikedSheet = false }) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(likedItems) { item ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    PillBadge(
                                        text = item.mediaType,
                                        containerColor = if (item.mediaType == "VIDEO") RoseRed.copy(alpha = 0.15f) else EmeraldPrimary.copy(alpha = 0.15f),
                                        contentColor = if (item.mediaType == "VIDEO") RoseRed else EmeraldPrimary
                                    )
                                    Text(item.timeAgo, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(item.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(item.snippet, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("By ${item.author} (${item.handle})", fontSize = 11.sp, color = EmeraldPrimary, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }
    }

    // --- 5. REPOSTS BOTTOM SHEET ---
    if (showRepostsSheet) {
        ModalBottomSheet(
            onDismissRequest = { showRepostsSheet = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f)
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Rounded.Repeat, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(20.dp))
                        Text("Your Reposts (${repostedItems.size})", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    }
                    IconButton(onClick = { showRepostsSheet = false }) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(repostedItems) { item ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    PillBadge(text = "REPOST", containerColor = EmeraldPrimary.copy(alpha = 0.15f), contentColor = EmeraldPrimary)
                                    Text(item.timeAgo, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(item.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(item.snippet, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Original: ${item.author} (${item.handle})", fontSize = 11.sp, color = EmeraldPrimary, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }
    }

    // --- 6. BOOKMARKS BOTTOM SHEET ---
    if (showBookmarksSheet) {
        ModalBottomSheet(
            onDismissRequest = { showBookmarksSheet = false },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .fillMaxHeight(0.85f)
                    .padding(horizontal = 20.dp)
                    .padding(bottom = 20.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Rounded.Bookmark, contentDescription = null, tint = SkyBlue, modifier = Modifier.size(20.dp))
                        Text("Saved Bookmarks & Guides (${bookmarkedItems.size})", fontWeight = FontWeight.Bold, fontSize = 17.sp)
                    }
                    IconButton(onClick = { showBookmarksSheet = false }) {
                        Icon(Icons.Rounded.Close, contentDescription = "Close")
                    }
                }

                Spacer(modifier = Modifier.height(12.dp))

                LazyColumn(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    items(bookmarkedItems) { item ->
                        Surface(
                            shape = RoundedCornerShape(16.dp),
                            color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Column(modifier = Modifier.padding(14.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    PillBadge(text = item.mediaType, containerColor = SkyBlue.copy(alpha = 0.15f), contentColor = SkyBlue)
                                    Text(item.timeAgo, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                }
                                Spacer(modifier = Modifier.height(6.dp))
                                Text(item.title, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Spacer(modifier = Modifier.height(2.dp))
                                Text(item.snippet, fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Spacer(modifier = Modifier.height(6.dp))
                                Text("Saved from ${item.author}", fontSize = 11.sp, color = EmeraldPrimary, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                }
            }
        }
    }
}


@Composable
fun SettingsToggleRow(
    icon: ImageVector,
    title: String,
    subtitle: String,
    isChecked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            modifier = Modifier.weight(1f),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(imageVector = icon, contentDescription = null, tint = EmeraldPrimary, modifier = Modifier.size(22.dp))
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(text = title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.onSurface)
                Text(text = subtitle, fontSize = 11.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
        Switch(
            checked = isChecked,
            onCheckedChange = onCheckedChange,
            colors = SwitchDefaults.colors(
                checkedThumbColor = Color.White,
                checkedTrackColor = EmeraldPrimary
            )
        )
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Settings Light")
@Composable
fun SettingsScreenPreview() {
    FMSTheme(darkTheme = false) {
        SettingsScreen()
    }
}

@androidx.compose.ui.tooling.preview.Preview(showBackground = true, name = "Settings Dark")
@Composable
fun SettingsScreenDarkPreview() {
    FMSTheme(darkTheme = true) {
        SettingsScreen()
    }
}
