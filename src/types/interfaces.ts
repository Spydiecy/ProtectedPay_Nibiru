import { ReactNode } from 'react';

  export interface RawContractPayment {
    creator: string;
    recipient: string;
    totalAmount: string;
    amountPerPerson: string;
    numParticipants: number;
    amountCollected: string;
    timestamp: unknown;
    status: unknown;
    remarks: string;
  }
  
  export interface GroupPayment {
    id: string;
    paymentId: string;
    creator: string;
    recipient: string;
    totalAmount: string;
    amountPerPerson: string;
    numParticipants: number;
    amountCollected: string;
    timestamp: number;
    status: number;
    remarks: string;
  }
  
  export interface RawContractPot {
    owner: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    timestamp: unknown;
    status: unknown;
    remarks: string;
  }
  
  export interface SavingsPot {
    id: string;
    potId: string;
    owner: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    timestamp: number;
    status: number;
    remarks: string;
  }

  export interface TabButtonProps {
    isActive: boolean;
    onClick: () => void;
    icon: ReactNode;
    text: string;
    count?: number;
  }
  
  export interface PotCardProps {
    pot: SavingsPot;
    onContribute: (potId: string, amount: string) => Promise<void>;
    onBreak: (potId: string) => Promise<void>;
    isLoading: boolean;
  }

  export interface SavingsPot {
    id: string;
    potId: string;
    owner: string;
    name: string;
    targetAmount: string;
    currentAmount: string;
    timestamp: number;
    status: number;
    remarks: string;
}

// Add these new interfaces
  export interface YieldInfo {
    apy: number;
    risk: 'Low' | 'Medium' | 'High';
    totalLiquidity: number;
    volume24h: number;
  }

export interface CrossChainOpportunity {
    chainId: string;
    poolAddress: string;
    apy: number;
    token: string;
    liquidity: number;
}

export interface PotCardProps {
    pot: SavingsPot;
    onContribute: (potId: string, amount: string) => Promise<void>;
    onBreak: (potId: string) => Promise<void>;
    isLoading: boolean;
}