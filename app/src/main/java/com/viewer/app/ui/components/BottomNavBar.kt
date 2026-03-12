package com.viewer.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.SlateText

@Composable
fun AppBottomNavBar(navController: NavController, currentRoute: String?) {
    NavigationBar(
        containerColor = MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
        tonalElevation = 8.dp
    ) {
        val items = listOf(
            BottomNavItem("Home", "home", Icons.Default.Home),
            BottomNavItem("Explore", "explore", Icons.Default.Explore),
            BottomNavItem("Post", "content_editor", Icons.Default.AddBox),
            BottomNavItem("Library", "profile", Icons.Default.Bookmarks), // Using profile as library placeholder
            BottomNavItem("Profile", "profile", Icons.Default.Person)
        )

        items.forEach { item ->
            val isSelected = currentRoute == item.route
            NavigationBarItem(
                icon = { 
                    if (item.label == "Post") {
                        Surface(
                            shape = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
                            color = PrimaryRed,
                            shadowElevation = 4.dp
                        ) {
                            Icon(
                                item.icon, 
                                contentDescription = item.label,
                                modifier = Modifier.padding(8.dp),
                                tint = MaterialTheme.colorScheme.onPrimary
                            )
                        }
                    } else {
                        Icon(item.icon, contentDescription = item.label)
                    }
                },
                label = { if (item.label != "Post") Text(item.label, style = MaterialTheme.typography.labelSmall) },
                selected = isSelected,
                onClick = {
                    if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo("home") { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryRed,
                    selectedTextColor = PrimaryRed,
                    unselectedIconColor = SlateText.copy(alpha = 0.4f),
                    unselectedTextColor = SlateText.copy(alpha = 0.4f),
                    indicatorColor = MaterialTheme.colorScheme.surface
                )
            )
        }
    }
}

data class BottomNavItem(val label: String, val route: String, val icon: ImageVector)
