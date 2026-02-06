import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Wallet, 
  DollarSign,
  Loader2,
  Upload,
  FileCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from "framer-motion";
import GlowCard from "@/components/ui/GlowCard";
import { toast } from "sonner";

export default function AddFunds() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [note, setNote] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickAmounts = [10, 25, 50, 100, 250, 500];

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['payment-methods-active'],
    queryFn: () => base44.entities.PaymentMethod.filter({ is_active: true }, 'sort_order'),
    initialData: [],
  });

  useEffect(() => {
    const loadUser = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          base44.auth.redirectToLogin(window.location.href);
          return;
        }
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmit = async () => {
    const depositAmount = parseFloat(amount);
    if (!depositAmount || depositAmount < 5) {
      toast.error('Minimum deposit is $5');
      return;
    }

    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    if (!referenceNumber.trim()) {
      toast.error('Please enter the reference number');
      return;
    }

    setIsSubmitting(true);

    try {
      let proofImageUrl = '';
      
      if (proofFile) {
        const uploadResult = await base44.integrations.Core.UploadFile({ file: proofFile });
        proofImageUrl = uploadResult.file_url;
      }

      await base44.entities.DepositRequest.create({
        user_email: user.email,
        method: selectedMethod,
        amount: depositAmount,
        currency: 'USD',
        reference_number: referenceNumber,
        proof_image_url: proofImageUrl,
        note: note,
        status: 'pending'
      });

      toast.success('Deposit request submitted! Waiting for admin approval.');
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit deposit request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  const selectedMethodData = paymentMethods.find(m => m.code === selectedMethod);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* UI content */}
      </div>
    </div>
  );
}
