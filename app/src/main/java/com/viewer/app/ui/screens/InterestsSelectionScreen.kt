package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.WarmOrange
import com.viewer.app.ui.theme.CreamBg

@Composable
fun InterestsSelectionScreen(navController: NavController) {
    val categories = listOf(
        "National Security", "Healthcare Policy", "Agricultural Reforms", "Digital India",
        "Economic Growth", "Foreign Policy", "Defense Updates", "Election 2024",
        "PMO Initiatives", "Social Justice", "Infrastructure", "Atmanirbhar Bharat",
        "Rural Development", "Youth Empowerment", "State Governance", "Cultural Heritage"
    )
    val selectedCategories = remember { mutableStateListOf<String>() }
    
    val slate300 = Color(0xFFCBD5E1)
    val slate500 = Color(0xFF64748B)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(CreamBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(modifier = Modifier.height(48.dp))
        
        Text(
            "What matters to you?",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = Color.Black
        )
        Text(
            "Select at least 3 political themes to personalize your forum",
            style = MaterialTheme.typography.bodyMedium,
            color = slate500,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            modifier = Modifier.weight(1f),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(categories) { category ->
                val isSelected = selectedCategories.contains(category)
                Surface(
                    onClick = {
                        if (isSelected) selectedCategories.remove(category)
                        else selectedCategories.add(category)
                    },
                    modifier = Modifier.fillMaxWidth().height(90.dp),
                    shape = RoundedCornerShape(20.dp),
                    color = if (isSelected) PrimaryRed.copy(alpha = 0.05f) else Color.White,
                    border = androidx.compose.foundation.BorderStroke(
                        width = if (isSelected) 2.dp else 1.dp,
                        color = if (isSelected) PrimaryRed else slate300
                    ),
                    shadowElevation = if (isSelected) 0.dp else 1.dp
                ) {
                    Box(contentAlignment = Alignment.Center, modifier = Modifier.padding(12.dp)) {
                        Text(
                            category,
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = if (isSelected) FontWeight.ExtraBold else FontWeight.Bold,
                            color = if (isSelected) PrimaryRed else Color.DarkGray,
                            textAlign = TextAlign.Center
                        )
                        if (isSelected) {
                            Icon(
                                Icons.Default.CheckCircle,
                                null,
                                modifier = Modifier.align(Alignment.TopEnd).size(20.dp),
                                tint = PrimaryRed
                            )
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = {
                if (selectedCategories.size >= 3) {
                    navController.navigate("home") {
                        popUpTo("splash") { inclusive = true }
                    }
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            contentPadding = PaddingValues(0.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.Transparent,
                disabledContainerColor = Color.LightGray.copy(alpha = 0.5f)
            ),
            enabled = selectedCategories.size >= 3
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = if (selectedCategories.size >= 3) 
                            Brush.horizontalGradient(listOf(PrimaryRed, WarmOrange))
                            else Brush.horizontalGradient(listOf(Color.LightGray, Color.Gray)),
                        shape = RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text(
                    if (selectedCategories.size < 3) "Select ${3 - selectedCategories.size} more" else "Start Journey",
                    color = Color.White, 
                    fontWeight = FontWeight.ExtraBold,
                    fontSize = 16.sp
                )
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}
