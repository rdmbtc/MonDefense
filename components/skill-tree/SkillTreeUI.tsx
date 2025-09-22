"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Trophy, 
  Zap, 
  Lock, 
  Unlock, 
  Star, 
  Target, 
  Flame, 
  Snowflake, 
  Wind, 
  Shield,
  Crown,
  Swords
} from 'lucide-react';

interface SkillTreeUIProps {
  skillTreeManager: any; // SkillTreeManager instance
  isVisible: boolean;
  onClose: () => void;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  scoreRequired: number;
  enemiesRequired: number;
  unlocked: boolean;
}

interface DefenderData {
  name: string;
  description: string;
  tiers: {
    [key: number]: {
      scoreRange: [number, number];
      skills: Skill[];
    };
  };
}

interface ProgressData {
  totalScore: number;
  enemiesDefeated: number;
  unlockedSkills: string[];
  activeSkills: {
    [defenderType: string]: string[];
  };
  selectedDefender?: string;
}

const defenderIcons = {
  CHOG: Wind,
  MOLANDAK: Snowflake,
  MOYAKI: Flame,
  KEON: Shield
};

const defenderColors = {
  CHOG: 'from-cyan-500 to-blue-600',
  MOLANDAK: 'from-blue-400 to-indigo-600',
  MOYAKI: 'from-red-500 to-orange-600',
  KEON: 'from-purple-500 to-violet-600'
};

const tierColors = {
  1: 'border-green-400 bg-green-50 dark:bg-green-950',
  2: 'border-blue-400 bg-blue-50 dark:bg-blue-950',
  3: 'border-purple-400 bg-purple-50 dark:bg-purple-950'
};

export default function SkillTreeUI({ skillTreeManager, isVisible, onClose }: SkillTreeUIProps) {
  const [selectedDefender, setSelectedDefender] = useState('CHOG');
  const [progressData, setProgressData] = useState<ProgressData>({
    totalScore: 0,
    enemiesDefeated: 0,
    unlockedSkills: [],
    activeSkills: {}
  });
  const [defenderData, setDefenderData] = useState<DefenderData | null>(null);

  // Update progress data when skill tree manager changes
  const updateProgressData = useCallback(() => {
    if (skillTreeManager) {
      const data = skillTreeManager.getProgressData();
      setProgressData(data);
      setSelectedDefender(data.selectedDefender);
      
      const defender = skillTreeManager.getDefenderSkills(data.selectedDefender);
      setDefenderData(defender);
    }
  }, [skillTreeManager]);

  // Listen for progress updates
  useEffect(() => {
    if (!skillTreeManager) return;

    updateProgressData();

    const handleProgressUpdate = () => {
      updateProgressData();
    };

    const handleSkillUnlocked = (event: CustomEvent) => {
      const { skill, defender } = event.detail;
      toast.success(`New skill unlocked: ${skill.name} for ${defender}!`, {
        description: skill.description,
        duration: 5000
      });
      updateProgressData();
    };

    window.addEventListener('skillTreeProgressUpdate', handleProgressUpdate);
    window.addEventListener('skillUnlocked', handleSkillUnlocked as EventListener);

    return () => {
      window.removeEventListener('skillTreeProgressUpdate', handleProgressUpdate);
      window.removeEventListener('skillUnlocked', handleSkillUnlocked as EventListener);
    };
  }, [skillTreeManager, updateProgressData]);

  // Handle defender selection
  const handleDefenderSelect = (defenderId: string) => {
    if (skillTreeManager) {
      skillTreeManager.setSelectedDefender(defenderId);
      setSelectedDefender(defenderId);
      const defender = skillTreeManager.getDefenderSkills(defenderId);
      setDefenderData(defender);
    }
  };

  // Handle skill unlock
  const handleSkillUnlock = (skillId: string) => {
    if (skillTreeManager && skillTreeManager.unlockSkill(skillId)) {
      toast.success('Skill unlocked successfully!');
      updateProgressData();
    } else {
      toast.error('Failed to unlock skill. Check requirements.');
    }
  };

  // Handle skill activation/deactivation
  const handleSkillToggle = (skillId: string) => {
    if (!skillTreeManager) return;

    const activeSkills = skillTreeManager.getActiveSkills(selectedDefender);
    const isActive = activeSkills.has(skillId);

    if (isActive) {
      skillTreeManager.deactivateSkill(skillId, selectedDefender);
      toast.info('Skill deactivated');
    } else {
      skillTreeManager.activateSkill(skillId, selectedDefender);
      toast.success('Skill activated!');
    }
    updateProgressData();
  };

  // Calculate progress percentage for a skill
  const getSkillProgress = (skill: Skill) => {
    const scoreProgress = Math.min(100, (progressData.totalScore / skill.scoreRequired) * 100);
    const enemyProgress = Math.min(100, (progressData.enemiesDefeated / skill.enemiesRequired) * 100);
    return Math.min(scoreProgress, enemyProgress);
  };

  // Check if skill is active
  const isSkillActive = (skillId: string) => {
    return progressData.activeSkills[selectedDefender]?.includes?.(skillId) || false;
  };

  // Render skill node
  const renderSkillNode = (skill: Skill, tierNumber: number) => {
    const progress = getSkillProgress(skill);
    const canUnlock = skill.unlocked && !progressData.unlockedSkills.includes(skill.id);
    const isUnlocked = progressData.unlockedSkills.includes(skill.id);
    const isActive = isSkillActive(skill.id);

    return (
      <Card 
        key={skill.id} 
        className={`relative transition-all duration-300 hover:shadow-lg ${
          isActive ? 'ring-2 ring-yellow-400 shadow-yellow-200' : ''
        } ${tierColors[tierNumber as keyof typeof tierColors]}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {isUnlocked ? (
                <Unlock className="w-4 h-4 text-green-500" />
              ) : skill.unlocked ? (
                <Star className="w-4 h-4 text-yellow-500" />
              ) : (
                <Lock className="w-4 h-4 text-gray-400" />
              )}
              {skill.name}
            </CardTitle>
            <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
              Tier {tierNumber}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            {skill.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            {/* Requirements */}
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex items-center justify-between">
                <span>Score: {skill.scoreRequired.toLocaleString()}</span>
                <span className={progressData.totalScore >= skill.scoreRequired ? 'text-green-500' : ''}>
                  {progressData.totalScore.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Enemies: {skill.enemiesRequired}</span>
                <span className={progressData.enemiesDefeated >= skill.enemiesRequired ? 'text-green-500' : ''}>
                  {progressData.enemiesDefeated}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={progress} className="h-2" />

            {/* Action buttons */}
            <div className="flex gap-2">
              {canUnlock && (
                <Button 
                  size="sm" 
                  onClick={() => handleSkillUnlock(skill.id)}
                  className="flex-1 text-xs"
                >
                  <Unlock className="w-3 h-3 mr-1" />
                  Unlock
                </Button>
              )}
              
              {isUnlocked && (
                <Button 
                  size="sm" 
                  variant={isActive ? "destructive" : "default"}
                  onClick={() => handleSkillToggle(skill.id)}
                  className="flex-1 text-xs"
                >
                  {isActive ? (
                    <>
                      <Target className="w-3 h-3 mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 mr-1" />
                      Activate
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render defender tab
  const renderDefenderTab = (defenderId: string) => {
    const DefenderIcon = defenderIcons[defenderId as keyof typeof defenderIcons];
    const defender = skillTreeManager?.getDefenderSkills(defenderId);
    
    if (!defender) return null;

    return (
      <TabsContent key={defenderId} value={defenderId} className="space-y-6">
        {/* Defender header */}
        <Card className={`bg-gradient-to-r ${defenderColors[defenderId as keyof typeof defenderColors]} text-white`}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <DefenderIcon className="w-8 h-8" />
              <div>
                <div className="text-2xl font-bold">{defender.name}</div>
                <div className="text-sm opacity-90">{defender.description}</div>
              </div>
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Skill tiers */}
        <div className="space-y-6">
          {Object.entries(defender.tiers).map(([tierNum, tier]) => {
            const tierData = tier as { scoreRange: [number, number]; skills: Skill[] };
            return (
              <div key={tierNum} className="space-y-3">
                <div className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold">
                    Tier {tierNum} Skills
                  </h3>
                  <Badge variant="outline">
                    {tierData.scoreRange[0].toLocaleString()} - {tierData.scoreRange[1].toLocaleString()} Score
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tierData.skills.map((skill: Skill) => renderSkillNode(skill, parseInt(tierNum)))}
                </div>
              
              {parseInt(tierNum) < Object.keys(defender.tiers).length && (
                <Separator className="my-4" />
              )}
            </div>
            );
          })}
        </div>
      </TabsContent>
    );
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-6 h-6" />
                Skill Tree
              </CardTitle>
              <CardDescription>
                Unlock and activate powerful abilities for your defenders
              </CardDescription>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
          
          {/* Progress summary */}
          <div className="flex items-center gap-6 pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold">{progressData.totalScore.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground">Total Score</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-red-500" />
              <span className="font-semibold">{progressData.enemiesDefeated}</span>
              <span className="text-sm text-muted-foreground">Enemies Defeated</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-blue-500" />
              <span className="font-semibold">{progressData.unlockedSkills.length}</span>
              <span className="text-sm text-muted-foreground">Skills Unlocked</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <Tabs value={selectedDefender} onValueChange={handleDefenderSelect} className="h-full">
            <TabsList className="grid w-full grid-cols-4 rounded-none border-b">
              {skillTreeManager?.getAllDefenders().map((defenderId: string) => {
                const DefenderIcon = defenderIcons[defenderId as keyof typeof defenderIcons];
                return (
                  <TabsTrigger 
                    key={defenderId} 
                    value={defenderId}
                    className="flex items-center gap-2"
                  >
                    <DefenderIcon className="w-4 h-4" />
                    {defenderId}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
              {skillTreeManager?.getAllDefenders().map((defenderId: string) => 
                renderDefenderTab(defenderId)
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}