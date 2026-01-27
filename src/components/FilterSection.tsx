import { motion } from "framer-motion";
import { AI_FILTERS } from "@/lib/filters";
import { FilterCard } from "@/components/FilterCard";
import React from "react";
import { StyleSheet, Text, View, ScrollView, Image, Dimensions } from "react-native";
import Video from "react-native-video";
import Reanimated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";

const { width } = Dimensions.get("window");

const Section = ({ title, content, imageUrl, videoUrl }) => {
  const scrollY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withTiming(scrollY.value * 0.5) }],
  }));

  return (
    <View style={styles.section}>
      <Reanimated.View style={animatedStyle}>
        {imageUrl && <Image source={{ uri: imageUrl }} style={styles.image} />}
        {videoUrl && <Video source={{ uri: videoUrl }} style={styles.video} paused={true} controls={true} />}
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.content}>{content}</Text>
      </Reanimated.View>
    </View>
  );
};

const App = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Section
        title="Introduction to My Lovable Project"
        content="This project, built on Lovable.dev, is an AI-powered app for [describe your project, e.g., event marketing]. It started as a simple prompt and evolved into a full-stack tool."
        imageUrl="https://example.com/project-intro-image.jpg" // Replace with your image
      />
      <Section
        title="Key Features"
        content="Features include AI-driven [e.g., event planning, user auth, real-time updates]. Built with React, Supabase, and AI prompts for rapid iteration."
        videoUrl="https://example.com/project-demo-video.mp4" // Embed a demo video
      />
      <Section
        title="Development Journey"
        content="From idea to launch: Used Lovable's chat interface to generate code, exported to GitHub for tweaks, and deployed in weeks. Challenges included [e.g., integrating APIs]."
        imageUrl="https://example.com/timeline-image.jpg"
      />
      <Section
        title="Future Vision"
        content="Next steps: Add [e.g., mobile notifications, scaling to 10k users]. Join us in building the future!"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  contentContainer: { alignItems: "center", paddingBottom: 50 },
  section: { width, padding: 20, alignItems: "center", marginVertical: 20 },
  image: { width: width - 40, height: 200, borderRadius: 10 },
  video: { width: width - 40, height: 200 },
  title: { fontSize: 24, fontWeight: "bold", marginVertical: 10 },
  content: { fontSize: 16, textAlign: "center" },
});

export default App;
