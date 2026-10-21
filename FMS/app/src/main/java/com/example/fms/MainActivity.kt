package com.example.fms

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.data.model.UserRole
import com.example.fms.ui.screens.AggregatorDashboard
import com.example.fms.ui.screens.FarmerDashboard
import com.example.fms.ui.screens.VetDashboard
import com.example.fms.ui.screens.WorkerDashboard
import com.example.fms.ui.theme.EmeraldPrimary
import com.example.fms.ui.theme.FMSTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            FMSTheme {
                FMSApp()
            }
        }
    }
}

@Composable
fun FMSApp() {
    var activeRole by remember { mutableStateOf(UserRole.FARMER) }

    Scaffold(
        modifier = Modifier.fillMaxSize(),
        bottomBar = {
            RoleSwitcherFloatingPill(
                selectedRole = activeRole,
                onRoleSelected = { activeRole = it }
            )
        }
    ) { innerPadding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(bottom = innerPadding.calculateBottomPadding())
        ) {
            AnimatedContent(
                targetState = activeRole,
                transitionSpec = {
                    fadeIn() + slideInVertically { it / 6 } togetherWith
                            fadeOut() + slideOutVertically { -it / 6 }
                },
                label = "RoleDashboardAnimation"
            ) { role ->
                when (role) {
                    UserRole.FARMER -> FarmerDashboard()
                    UserRole.FARM_WORKER -> WorkerDashboard()
                    UserRole.VETERINARIAN -> VetDashboard()
                    UserRole.AGGREGATOR -> AggregatorDashboard()
                }
            }
        }
    }
}

@Composable
fun RoleSwitcherFloatingPill(
    selectedRole: UserRole,
    onRoleSelected: (UserRole) -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 20.dp, vertical = 12.dp)
            .navigationBarsPadding(),
        shape = RoundedCornerShape(28.dp),
        color = MaterialTheme.colorScheme.surface.copy(alpha = 0.96f),
        tonalElevation = 8.dp,
        shadowElevation = 12.dp,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 8.dp, vertical = 6.dp)
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.SpaceEvenly,
            verticalAlignment = Alignment.CenterVertically
        ) {
            RoleTabPill(
                title = "Farmer",
                icon = Icons.Rounded.Agriculture,
                isSelected = selectedRole == UserRole.FARMER,
                onClick = { onRoleSelected(UserRole.FARMER) }
            )
            RoleTabPill(
                title = "Worker",
                icon = Icons.Rounded.Engineering,
                isSelected = selectedRole == UserRole.FARM_WORKER,
                onClick = { onRoleSelected(UserRole.FARM_WORKER) }
            )
            RoleTabPill(
                title = "Vet",
                icon = Icons.Rounded.MedicalServices,
                isSelected = selectedRole == UserRole.VETERINARIAN,
                onClick = { onRoleSelected(UserRole.VETERINARIAN) }
            )
            RoleTabPill(
                title = "Buyer",
                icon = Icons.Rounded.Storefront,
                isSelected = selectedRole == UserRole.AGGREGATOR,
                onClick = { onRoleSelected(UserRole.AGGREGATOR) }
            )
        }
    }
}

@Composable
fun RoleTabPill(
    title: String,
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val bg = if (isSelected) EmeraldPrimary else Color.Transparent
    val contentColor = if (isSelected) Color.White else MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)

    Row(
        modifier = Modifier
            .clip(RoundedCornerShape(20.dp))
            .background(bg)
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = icon,
            contentDescription = title,
            tint = contentColor,
            modifier = Modifier.size(17.dp)
        )
        Spacer(modifier = Modifier.width(6.dp))
        Text(
            text = title,
            color = contentColor,
            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
            fontSize = 13.sp
        )
    }
}
