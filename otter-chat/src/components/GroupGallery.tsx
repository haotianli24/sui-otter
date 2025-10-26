// import { useState } from "react";
// import { useSuiClient } from "@mysten/dapp-kit";
// import { Group } from "../types/group";
// import { GroupCard } from "./GroupCard";

// export const GroupGallery = () => {
//   const [groups, setGroups] = useState<Group[]>([]);
//   const suiClient = useSuiClient();

//   useEffect(() => {
//     const fetchGroups = async () => {
//       const groups = await suiClient.getGroups();
//       setGroups(groups);
//     }