"use client";

import { useEffect, useState } from "react";
import type { NextPage } from "next";

import { Holding } from "./components/Holding";
import { Selling } from "./components/Selling";

import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import "react-tabs/style/react-tabs.css";
import "~~/styles/tabs.css";

const HoldingTab = "Holding Emojis";
const SellingTab = "Selling Emojis";

const MyEmojis: NextPage = () => {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-6">
        <Tabs className="w-full ps-6 pe-6"
          selectedIndex={selectedTab} onSelect={(index) => setSelectedTab(index)}>
          <TabList>
            <Tab>{HoldingTab}</Tab>
            <Tab>{SellingTab}</Tab>
          </TabList>

          <TabPanel>
            <Holding onSell={() => setSelectedTab(1)} />
          </TabPanel>
          <TabPanel>
            <Selling />
          </TabPanel>
        </Tabs>
      </div>
    </>
  );
};

export default MyEmojis;
