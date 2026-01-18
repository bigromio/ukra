
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { Trophy, Medal } from 'lucide-react';

export const Leaderboard = () => {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('points_balance', { ascending: false })
        .limit(5);
      
      if (data) setUsers(data as any);
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="font-num font-bold text-ukra-navy mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-ukra-gold" />
        صدارة الفريق (يناير)
      </h3>

      <div className="space-y-4">
        {users.map((user, idx) => {
          const isTop = idx === 0;
          const percentage = (user.points_balance || 0) / ((users[0]?.points_balance || 1) * 1.2) * 100;

          return (
            <div key={user.id} className="relative">
              <div className="flex justify-between items-center mb-1 text-sm">
                <div className="flex items-center gap-3">
                   <span className={`font-bold w-6 text-center ${idx < 3 ? 'text-ukra-gold' : 'text-gray-400'}`}>
                     #{idx + 1}
                   </span>
                   <span className={`font-bold ${isTop ? 'text-ukra-navy' : 'text-gray-600'}`}>
                     {user.name}
                   </span>
                   {isTop && <Medal className="w-4 h-4 text-ukra-gold" />}
                </div>
                <span className="font-num font-bold text-ukra-gold">{user.points_balance} pts</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-ukra-gold' : 'bg-gray-300'}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
