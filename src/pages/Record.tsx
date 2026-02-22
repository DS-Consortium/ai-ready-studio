      // Step 4: Invoke edge function moderation (auto-approves if clean)
      await moderateVideo(insertedVideo.id);

      // Step 5: Poll for moderation status (max 60 seconds, checks every 500ms)
      const pollResult = await pollModerationStatus(insertedVideo.id, 120, 500);

      if (pollResult.approved) {
        toast({
          title: "Video approved!",
          description: "Your video is now live in the gallery.",
        });
      } else {
        toast({
          title: "Content flagged for review",
          description: "Your video has been submitted but requires manual review before publishing.",
        });
      }

      setUploadedVideoUrl(urlData.publicUrl);
      setRecordingState("done");
