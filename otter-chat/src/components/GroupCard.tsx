import { Group } from "../types/group";
import { Card, Text, Heading, Button, Flex } from "@radix-ui/themes";

interface GroupCardProps {
  group: Group;
  onJoin?: (groupId: string) => void;
}

export function GroupCard({ group, onJoin }: GroupCardProps) {
  return (
    <Card size="2" style={{ minWidth: 300 }}>
      <Flex direction="column" gap="2">
        <Heading size="3">{group.name}</Heading>
        <Text size="2" color="gray">
          {group.description}
        </Text>
        
        <Flex justify="between" align="center">
          <Text size="1" color="gray">
            {group.currentMembers}/{group.maxMembers} members
          </Text>
          <Text size="1" weight="medium">
            {group.type === "free" ? "Free" : `${group.price} SUI`}
          </Text>
        </Flex>
        
        {onJoin && (
          <Button 
            size="2" 
            onClick={() => onJoin(group.id)}
            disabled={group.currentMembers >= group.maxMembers}
          >
            {group.currentMembers >= group.maxMembers ? "Full" : "Join"}
          </Button>
        )}
      </Flex>
    </Card>
  );
}
