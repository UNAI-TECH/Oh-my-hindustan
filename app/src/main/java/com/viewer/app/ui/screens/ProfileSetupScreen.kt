package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.WarmOrange
import com.viewer.app.ui.theme.CreamBg

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileSetupScreen(navController: NavController) {
    var username by remember { mutableStateOf("") }
    var bio by remember { mutableStateOf("") }

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
            "Create Your Political Profile",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = Color.Black
        )
        Text(
            "Let others know your political vision",
            style = MaterialTheme.typography.bodyMedium,
            color = slate500
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Profile Picture Placeholder
        Box(modifier = Modifier.size(120.dp), contentAlignment = Alignment.Center) {
            Surface(
                modifier = Modifier.fillMaxSize().clip(CircleShape).border(2.dp, PrimaryRed, CircleShape),
                color = Color.White
            ) {
                Icon(
                    Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.padding(24.dp).size(60.dp),
                    tint = Color.LightGray
                )
            }
            Surface(
                modifier = Modifier.align(Alignment.BottomEnd).size(36.dp),
                shape = CircleShape,
                color = PrimaryRed,
                border = androidx.compose.foundation.BorderStroke(2.dp, Color.White)
            ) {
                Icon(Icons.Default.AddAPhoto, null, tint = Color.White, modifier = Modifier.padding(8.dp).size(18.dp))
            }
        }

        Spacer(modifier = Modifier.height(48.dp))

        OutlinedTextField(
            value = username,
            onValueChange = { username = it },
            label = { Text("Display Name / Username") },
            placeholder = { Text("CitizenAnalyst") },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = slate300,
                focusedBorderColor = PrimaryRed,
                unfocusedLabelColor = slate500,
                focusedLabelColor = PrimaryRed,
                unfocusedContainerColor = Color.White,
                focusedContainerColor = Color.White
            )
        )

        Spacer(modifier = Modifier.height(24.dp))

        OutlinedTextField(
            value = bio,
            onValueChange = { bio = it },
            label = { Text("Bio") },
            placeholder = { Text("Tell us about your vision for the nation...") },
            modifier = Modifier.fillMaxWidth().height(140.dp),
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = slate300,
                focusedBorderColor = PrimaryRed,
                unfocusedLabelColor = slate500,
                focusedLabelColor = PrimaryRed,
                unfocusedContainerColor = Color.White,
                focusedContainerColor = Color.White
            )
        )

        Spacer(modifier = Modifier.weight(1f))

        Button(
            onClick = {
                if (username.isNotEmpty()) {
                    navController.navigate("interests_selection")
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            contentPadding = PaddingValues(0.dp),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(
                        brush = Brush.horizontalGradient(listOf(PrimaryRed, WarmOrange)),
                        shape = RoundedCornerShape(16.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                Text("Continue", color = Color.White, fontWeight = FontWeight.ExtraBold, fontSize = 16.sp)
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
    }
}
