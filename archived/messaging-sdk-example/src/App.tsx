import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Button, IconButton } from "@radix-ui/themes";
import { GitHubLogoIcon, DiscordLogoIcon } from "@radix-ui/react-icons";
import { SessionKeyProvider } from "./providers/SessionKeyProvider";
import { MessagingClientProvider } from "./providers/MessagingClientProvider";

import { CreateChannel } from "./components/CreateChannel";
import { ChannelList } from "./components/ChannelList";
import { Channel } from "./components/Channel";
import { FeedbackCard } from "./components/FeedbackCard";
import { FeedbackBubble } from "./components/FeedbackBubble";
import { useState, useEffect } from "react";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { MessagingStatus } from "./components/MessagingStatus";
import { trackEvent, AnalyticsEvents } from "./utils/analytics";
import { useFeedback } from "./hooks/useFeedback";
import { FeedbackService } from "./services/feedbackService";

function AppContent() {
  const currentAccount = useCurrentAccount();
  const [prevAccount, setPrevAccount] = useState(currentAccount);
  const [channelId, setChannelId] = useState<string | null>(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

  const {
    isOpen: isFeedbackOpen,
    isSending: isFeedbackSending,
    error: feedbackError,
    showBubble,
    shouldShowPrompt,
    openFeedback,
    closeFeedback,
    submitFeedback,
    handleOptOut,
    trackInteraction,
  } = useFeedback();

  // Track wallet connection changes
  useEffect(() => {
    if (currentAccount && !prevAccount) {
      trackEvent(AnalyticsEvents.WALLET_CONNECTED, {
        address: currentAccount.address,
      });
    } else if (!currentAccount && prevAccount) {
      trackEvent(AnalyticsEvents.WALLET_DISCONNECTED);
    }
    setPrevAccount(currentAccount);
  }, [currentAccount, prevAccount]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      setChannelId(isValidSuiObjectId(hash) ? hash : null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Show feedback prompt automatically when threshold is reached
  useEffect(() => {
    if (shouldShowPrompt && !isFeedbackOpen && currentAccount) {
      openFeedback();
      // Mark the card as shown so it won't auto-popup again
      FeedbackService.markCardShown();
    }
  }, [shouldShowPrompt, isFeedbackOpen, currentAccount, openFeedback]);

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        align="center"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Flex align="center" gap="2">
          <Heading>Messaging SDK Example</Heading>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => {
              trackEvent(AnalyticsEvents.GITHUB_CLICKED);
              window.open('https://github.com/MystenLabs/messaging-sdk-example', '_blank');
            }}
          >
            <GitHubLogoIcon width="24" height="24" />
          </IconButton>
          <IconButton
            size="2"
            variant="ghost"
            onClick={() => {
              trackEvent(AnalyticsEvents.DISCORD_CLICKED);
              window.open('https://discord.gg/sS893zcPMN', '_blank');
            }}
          >
            <DiscordLogoIcon width="24" height="24" />
          </IconButton>
        </Flex>

        <Box>
          <Flex gap="2" align="center">
            {currentAccount && (
              <Button
                variant="soft"
                onClick={() => {
                  trackEvent(AnalyticsEvents.FAUCET_CLICKED, {
                    address: currentAccount.address,
                  });
                  window.open(`https://faucet.sui.io/?address=${currentAccount.address}`, '_blank');
                }}
              >
                Get Testnet SUI
              </Button>
            )}
            <ConnectButton />
          </Flex>
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
        >
          {currentAccount ? (
            channelId ? (
              <Channel
                channelId={channelId}
                onBack={() => {
                  window.location.hash = '';
                  setChannelId(null);
                }}
                onInteraction={trackInteraction}
              />
            ) : (
              <Flex direction="column" gap="4">
                <MessagingStatus />
                <CreateChannel onInteraction={trackInteraction} />
                <ChannelList />
              </Flex>
            )
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>

      {/* Feedback Components */}
      {isFeedbackOpen && currentAccount && (
        <FeedbackCard
          onSubmit={submitFeedback}
          onClose={closeFeedback}
          onOptOut={handleOptOut}
          isSubmitting={isFeedbackSending}
          error={feedbackError}
        />
      )}

      {showBubble && !isFeedbackOpen && currentAccount && (
        <FeedbackBubble
          onClick={openFeedback}
          isVisible={true}
        />
      )}
    </>
  );
}

function App() {
  return (
    <SessionKeyProvider>
      <MessagingClientProvider>
        <AppContent />
      </MessagingClientProvider>
    </SessionKeyProvider>
  );
}

export default App;
