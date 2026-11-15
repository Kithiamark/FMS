package com.example.fms.ui.components.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.ChatBubble
import androidx.compose.material.icons.rounded.Home
import androidx.compose.material.icons.rounded.People
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.theme.*

data class BottomNavItem(
    val id: String,
    val title: String,
    val icon: ImageVector,
    val badgeCount: Int = 0
)

/**
 * Gone-App Inspired Floating Capsule Island Bottom Navigation Bar
 * Sleek floating capsule with active pill indicator behind selected icons,
 * high contrast aesthetics, subtle translucent border, and stacked labels.
 */
@Composable
fun IslandBottomBar(
    items: List<BottomNavItem>,
    selectedId: String,
    onItemSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    Surface(
        modifier = modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 10.dp)
            .navigationBarsPadding(),
        shape = RoundedCornerShape(36.dp),
        color = ForestGreen.copy(alpha = 0.96f),
        tonalElevation = 12.dp,
        shadowElevation = 18.dp,
        border = androidx.compose.foundation.BorderStroke(
            1.dp,
            EmeraldPrimary.copy(alpha = 0.25f)
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 10.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val isSelected = item.id == selectedId

                val pillBackground by animateColorAsState(
                    targetValue = if (isSelected) EmeraldPrimary else Color.Transparent,
                    animationSpec = spring(stiffness = Spring.StiffnessMediumLow),
                    label = "pill_bg"
                )
                val iconTint by animateColorAsState(
                    targetValue = if (isSelected) ForestGreen else Color.White.copy(alpha = 0.75f),
                    label = "icon_tint"
                )
                val labelColor by animateColorAsState(
                    targetValue = if (isSelected) EmeraldLight else Color.White.copy(alpha = 0.75f),
                    label = "label_color"
                )

                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(20.dp))
                        .clickable(
                            interactionSource = remember { MutableInteractionSource() },
                            indication = null
                        ) { onItemSelected(item.id) }
                        .padding(horizontal = 6.dp, vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    // Pill Indicator encasing the icon
                    Box(
                        modifier = Modifier
                            .clip(RoundedCornerShape(16.dp))
                            .background(pillBackground)
                            .padding(horizontal = 18.dp, vertical = 5.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Box {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.title,
                                tint = iconTint,
                                modifier = Modifier.size(21.dp)
                            )
                            if (item.badgeCount > 0 && !isSelected) {
                                Surface(
                                    shape = CircleShape,
                                    color = EmeraldPrimary,
                                    modifier = Modifier
                                        .size(15.dp)
                                        .align(Alignment.TopEnd)
                                        .offset(x = 8.dp, y = (-6).dp)
                                ) {
                                    Box(contentAlignment = Alignment.Center) {
                                        Text(
                                            text = "${item.badgeCount}",
                                            fontSize = 8.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = Color.White
                                        )
                                    }
                                }
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(3.dp))

                    Text(
                        text = item.title,
                        color = labelColor,
                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                        fontSize = 10.sp,
                        letterSpacing = 0.3.sp
                    )
                }
            }
        }
    }
}

@Preview(showBackground = true, name = "Island Bottom Bar Light Preview")
@Composable
fun IslandBottomBarLightPreview() {
    val sampleItems = listOf(
        BottomNavItem("farm", "Farm", Icons.Rounded.Home),
        BottomNavItem("herd", "Herd", CowIcon),
        BottomNavItem("community", "Community", Icons.Rounded.People, badgeCount = 2),
        BottomNavItem("messages", "Messages", Icons.Rounded.ChatBubble, badgeCount = 1)
    )
    FMSTheme(darkTheme = false) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFFF1F5F9))
                .padding(vertical = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            IslandBottomBar(
                items = sampleItems,
                selectedId = "herd",
                onItemSelected = {}
            )
        }
    }
}

@Preview(showBackground = true, name = "Island Bottom Bar Dark Preview")
@Composable
fun IslandBottomBarDarkPreview() {
    val sampleItems = listOf(
        BottomNavItem("farm", "Farm", Icons.Rounded.Home),
        BottomNavItem("herd", "Herd", CowIcon),
        BottomNavItem("community", "Community", Icons.Rounded.People, badgeCount = 2),
        BottomNavItem("messages", "Messages", Icons.Rounded.ChatBubble, badgeCount = 1)
    )
    FMSTheme(darkTheme = true) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Color(0xFF0F172A))
                .padding(vertical = 20.dp),
            contentAlignment = Alignment.Center
        ) {
            IslandBottomBar(
                items = sampleItems,
                selectedId = "farm",
                onItemSelected = {}
            )
        }
    }
}
