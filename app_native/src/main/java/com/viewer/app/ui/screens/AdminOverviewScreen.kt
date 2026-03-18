package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.viewer.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminOverviewScreen(navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("GOVERNANCE_HUB", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    Surface(color = PrimaryRed, shape = RoundedCornerShape(8.dp), modifier = Modifier.padding(8.dp).size(32.dp)) {
                        Icon(Icons.Default.DashboardCustomize, null, tint = Color.White, modifier = Modifier.padding(4.dp))
                    }
                },
                actions = {
                    IconButton(onClick = {}) { Icon(Icons.Default.Notifications, null) }
                    Surface(color = Slate200, shape = CircleShape, modifier = Modifier.size(32.dp).padding(end = 8.dp)) {
                        Icon(Icons.Default.Person, null, tint = Slate600)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    actionIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Header
            Text("Governance Overview", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
            Text("National level platform statistics", style = MaterialTheme.typography.bodySmall, color = Slate500)
            
            Spacer(modifier = Modifier.height(24.dp))

            // KPI Cards
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AdminKpiCard("Verified Citizens", "125,432", "+12.5%", Icons.Default.Person, Color(0xFFE0F2FE), Color(0xFF0284C7), Modifier.weight(1f))
                AdminKpiCard("Active Debates", "12,240", "+5.2%", Icons.Default.Bolt, Color(0xFFDCFCE7), Color(0xFF16A34A), Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                AdminKpiCard("Platform Fund", "₹4.52Cr", "+18.1%", Icons.Default.AccountBalance, Color(0xFFFEF3C7), Color(0xFFD97706), Modifier.weight(1f))
                AdminKpiCard("Fact Check", "12 New", "Queue", Icons.Default.FactCheck, Color(0xFFFEE2E2), Color(0xFFDC2626), Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Payments
            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Recent Contributions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    AdminPaymentRow("amit_s", "₹499", "Verified", Color(0xFFDCFCE7), Color(0xFF16A34A))
                    HorizontalDivider(color = Color(0xFFF8FAFC), modifier = Modifier.padding(vertical = 12.dp))
                    AdminPaymentRow("raj_bjp", "₹1,200", "Review", Color(0xFFFEF3C7), Color(0xFFD97706))
                    HorizontalDivider(color = Color(0xFFF8FAFC), modifier = Modifier.padding(vertical = 12.dp))
                    AdminPaymentRow("priya_m", "₹150", "Verified", Color(0xFFDCFCE7), Color(0xFF16A34A))
                }
            }

            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = { navController.navigate("admin_monetization") },
                modifier = Modifier.fillMaxWidth().height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("View Economic Details", fontWeight = FontWeight.Bold)
            }
            
            Spacer(modifier = Modifier.height(32.dp))
        }
    }
}

@Composable
fun AdminKpiCard(label: String, value: String, change: String, icon: androidx.compose.ui.graphics.vector.ImageVector, bgColor: Color, iconColor: Color, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = MaterialTheme.colorScheme.surface,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                Surface(color = bgColor, shape = RoundedCornerShape(8.dp), modifier = Modifier.size(36.dp)) {
                    Icon(icon, null, tint = iconColor, modifier = Modifier.padding(8.dp))
                }
                Text(change, style = MaterialTheme.typography.labelSmall, color = Color(0xFF16A34A), fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(label, style = MaterialTheme.typography.labelMedium, color = Slate500)
            Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun AdminPaymentRow(user: String, amount: String, status: String, statusBg: Color, statusColor: Color) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Surface(color = Slate200, shape = CircleShape, modifier = Modifier.size(32.dp)) {
            Icon(Icons.Default.Person, null, tint = Slate600, modifier = Modifier.padding(6.dp))
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text("@$user", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            Text("Citizen Support", style = MaterialTheme.typography.labelSmall, color = Slate400)
        }
        Column(horizontalAlignment = Alignment.End) {
            Text(amount, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
            Surface(color = statusBg, shape = RoundedCornerShape(4.dp)) {
                Text(status.uppercase(), modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = statusColor, fontSize = 8.sp)
            }
        }
    }
}
