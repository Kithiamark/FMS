package com.example.fms.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.fms.ui.theme.*

/**
 * Reusable "Island Card"
 * A smooth floating card with soft rounded corners, ambient shadow,
 * subtle surface border, and spring click feedback.
 */
@Composable
fun IslandCard(
    modifier: Modifier = Modifier,
    cornerRadius: Dp = 24.dp,
    elevation: Dp = 4.dp,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    borderColor: Color = MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit
) {
    val interactionSource = remember { MutableInteractionSource() }
    val isPressed by interactionSource.collectIsPressedAsState()
    val scale by animateFloatAsState(
        targetValue = if (isPressed) 0.98f else 1.0f,
        animationSpec = spring(dampingRatio = 0.8f, stiffness = 400f),
        label = "island_card_press"
    )

    Card(
        modifier = modifier
            .scale(scale)
            .shadow(
                elevation = elevation,
                shape = RoundedCornerShape(cornerRadius),
                ambientColor = Color.Black.copy(alpha = 0.08f),
                spotColor = ForestGreen.copy(alpha = 0.12f)
            )
            .border(
                width = 1.dp,
                color = borderColor,
                shape = RoundedCornerShape(cornerRadius)
            )
            .then(
                if (onClick != null) {
                    Modifier.clickable(
                        interactionSource = interactionSource,
                        indication = null,
                        onClick = onClick
                    )
                } else Modifier
            ),
        shape = RoundedCornerShape(cornerRadius),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            content = content
        )
    }
}

/**
 * Pill Capsule Badge
 */
@Composable
fun PillBadge(
    text: String,
    containerColor: Color,
    contentColor: Color,
    icon: ImageVector? = null
) {
    Surface(
        shape = CircleShape,
        color = containerColor,
        contentColor = contentColor
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    modifier = Modifier.size(12.dp)
                )
            }
            Text(
                text = text,
                fontSize = 11.sp,
                fontWeight = FontWeight.Bold,
                letterSpacing = 0.5.sp
            )
        }
    }
}

/**
 * Top Hero Header with smooth curved bottom
 */
@Composable
fun HeroHeader(
    title: String,
    subtitle: String,
    roleBadge: String,
    onNotificationClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(bottomStart = 32.dp, bottomEnd = 32.dp))
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        ForestGreen,
                        EmeraldDark
                    )
                )
            )
            .padding(start = 24.dp, end = 24.dp, top = 48.dp, bottom = 48.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                PillBadge(
                    text = roleBadge,
                    containerColor = EmeraldPrimary.copy(alpha = 0.25f),
                    contentColor = EmeraldLight
                )
                Spacer(modifier = Modifier.height(10.dp))
                Text(
                    text = title,
                    color = Color.White,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = (-0.5).sp
                )
                Text(
                    text = subtitle,
                    color = EmeraldLight.copy(alpha = 0.85f),
                    fontSize = 13.sp,
                    fontWeight = FontWeight.Medium
                )
            }

            Surface(
                modifier = Modifier
                    .size(44.dp)
                    .clickable { onNotificationClick() },
                shape = RoundedCornerShape(14.dp),
                color = Color.White.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = "🔔",
                        fontSize = 18.sp
                    )
                }
            }
        }
    }
}
