import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/AuthContext'
import { Loader2 } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts'
import {
  MapPin,
  Settings,
  Music,
  Play,
  ExternalLink,
  Instagram,
  Twitter,
  Youtube,
  Globe,
  Link,
  Check,
  Users,
  Disc3,
  ListMusic,
  Share2,
  Edit3,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Ticket,
  TrendingUp,
  Image,
  Headphones,
  Album,
  Mic2,
} from 'lucide-react'

// Social icons mapping
const socialIcons = {
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  spotify: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  ),
  tiktok: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  ),
  soundcloud: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.185c-.041 0-.075.036-.084.087l-.175 1.072.18 1.081c.007.048.043.084.084.084.043 0 .075-.036.084-.085l.204-1.08-.204-1.072c-.01-.05-.041-.087-.089-.087zm1.775-.727c-.059 0-.104.052-.109.1l-.21 1.78.21 1.767c.005.058.05.104.109.104.059 0 .104-.046.11-.104l.237-1.767-.237-1.78c-.006-.06-.051-.1-.11-.1zm.867-.195c-.068 0-.117.059-.124.115l-.189 1.89.189 1.867c.007.06.056.115.124.115.065 0 .114-.055.123-.115l.213-1.867-.213-1.89c-.009-.065-.058-.115-.123-.115zm.875-.235c-.076 0-.131.062-.137.127l-.166 2.013.166 1.965c.006.065.061.127.137.127.074 0 .129-.062.136-.127l.189-1.965-.189-2.013c-.007-.065-.062-.127-.136-.127zm.875-.139c-.085 0-.145.072-.151.143l-.143 2.038.143 1.927c.006.07.066.141.151.141.085 0 .145-.072.151-.141l.162-1.927-.162-2.038c-.006-.07-.066-.143-.151-.143zm.879-.14c-.093 0-.157.078-.163.157l-.12 2.063.12 1.889c.006.079.07.157.163.157.092 0 .156-.078.162-.157l.137-1.889-.137-2.063c-.006-.079-.07-.157-.162-.157zm.872-.155c-.1 0-.17.084-.176.17l-.097 2.103.097 1.851c.006.087.076.17.176.17.099 0 .169-.083.176-.17l.111-1.851-.111-2.103c-.007-.086-.077-.17-.176-.17zm.895-.167c-.108 0-.182.09-.188.184l-.074 2.153.074 1.813c.006.094.08.184.188.184.107 0 .181-.09.188-.184l.084-1.813-.084-2.153c-.007-.094-.081-.184-.188-.184zm.873-.09c-.114 0-.193.096-.199.198l-.052 2.152.052 1.775c.006.1.085.197.199.197.114 0 .193-.097.2-.197l.059-1.775-.059-2.152c-.007-.102-.086-.198-.2-.198zm.931-.062c-.123 0-.208.102-.213.212l-.028 2.152.028 1.737c.005.109.09.212.213.212.121 0 .206-.103.212-.212l.033-1.737-.033-2.152c-.006-.11-.091-.212-.212-.212zm.868.037c-.121 0-.213.108-.213.224v3.85c0 .116.092.223.213.223.123 0 .213-.107.213-.223l.018-1.699-.018-2.152c0-.116-.09-.223-.213-.223zm3.023-.713c-.267 0-.522.044-.764.116-.161-1.825-1.703-3.262-3.578-3.262-.466 0-.92.092-1.338.257-.159.063-.212.126-.214.251v6.378c.002.129.096.237.223.249 0 0 5.659.003 5.671.003 1.337 0 2.423-1.086 2.423-2.423 0-1.338-1.086-2.424-2.423-2.424z"/>
    </svg>
  ),
  appleMusic: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M23.994 6.124c0-.007 0-.015-.001-.023v-.022c0-.006 0-.012-.001-.019v-.015c0-.005 0-.01-.001-.015v-.012c0-.004 0-.009-.001-.013v-.01c0-.004 0-.008-.001-.012v-.009c0-.003 0-.007-.001-.01v-.008c0-.003 0-.006-.001-.009v-.006c0-.003 0-.005-.001-.008v-.005c0-.002 0-.004-.001-.007v-.004c0-.002 0-.004-.001-.006v-.004c0-.002 0-.003-.001-.005V6c0-.001 0-.003-.001-.004V5.99c0-.001 0-.002-.001-.004v-.004c0-.001 0-.002-.001-.003v-.002c0-.001 0-.002-.001-.003v-.002c0-.001 0-.001-.001-.002v-.001c0-.001 0-.001-.001-.002v-.001c0-.001-.001-.001-.001-.002v-.001c0-.001-.001-.001-.001-.001v-.001l-.001-.001v-.001l-.001-.001s0-.001-.001-.001l-.001-.001-.001-.001s0-.001-.001-.001l-.001-.001c0-.001-.001-.001-.001-.001l-.001-.001-.001-.001c-.001 0-.001-.001-.001-.001l-.001-.001c-.001 0-.001-.001-.002-.001 0 0-.001-.001-.001-.001l-.002-.001c0-.001-.001-.001-.001-.001l-.002-.001c0-.001-.001-.001-.001-.001l-.002-.001c-.001 0-.001-.001-.002-.001l-.001-.001c-.001 0-.001-.001-.002-.001l-.001-.001c-.001-.001-.002-.001-.002-.001l-.001-.001c-.001-.001-.002-.001-.002-.001l-.002-.001c-.001-.001-.002-.001-.002-.002l-.002-.001c-.001-.001-.002-.001-.002-.001l-.002-.002c-.001-.001-.002-.001-.002-.001l-.003-.002-.002-.001-.003-.002c-.001-.001-.002-.001-.003-.002l-.002-.001-.003-.002c-.001-.001-.002-.001-.003-.002l-.003-.001-.003-.002c-.001-.001-.002-.001-.003-.002l-.003-.001-.004-.002c-.001-.001-.002-.001-.003-.002l-.004-.001-.004-.002-.003-.002-.004-.001-.004-.002-.004-.001-.005-.002-.004-.001-.005-.002-.005-.001-.005-.002-.005-.001-.005-.002-.006-.001-.005-.002-.006-.001-.006-.001-.006-.002-.006-.001-.007-.001-.006-.002-.007-.001-.007-.001-.007-.001-.007-.002-.008-.001-.007-.001-.008-.001-.008-.001-.008-.001-.009-.001-.008-.001-.009-.001-.009 0-.009-.001-.009-.001-.01 0-.009-.001-.01 0-.01-.001-.01 0-.011-.001-.01 0-.011 0-.011-.001-.011 0-.011 0-.012 0-.011-.001-.012 0-.012 0-.012 0-.013 0-.012 0-.013 0-.013 0-.013 0-.014 0-.013 0-.014 0-.014 0-.014 0-.015 0-.014 0-.015 0-.015 0-.015 0-.016 0-.015 0-.016 0-.016 0-.016 0-.017 0-.016 0-.017 0-.017 0-.017 0-.018 0-.017 0-.018 0-.018 0-.018 0-.018 0h-.019c-.006 0-.012 0-.019 0H8.41c-.006 0-.013 0-.019 0h-.018c-.006 0-.012 0-.018 0h-.018c-.006 0-.012 0-.018 0h-.017c-.006 0-.011 0-.017 0h-.017c-.005 0-.011 0-.017 0h-.016c-.005 0-.011 0-.016 0h-.016c-.005 0-.01 0-.016 0h-.015c-.005 0-.01 0-.015 0h-.015c-.005 0-.01 0-.015 0h-.014c-.005 0-.01 0-.014 0h-.014c-.005 0-.01 0-.014 0h-.014c-.004 0-.009 0-.014 0h-.013c-.004 0-.009 0-.013 0h-.013c-.004 0-.009 0-.013 0h-.013c-.004 0-.008 0-.012 0h-.012c-.004 0-.008 0-.012 0h-.012c-.004 0-.008 0-.012 0h-.011c-.004 0-.008 0-.011 0h-.011c-.004 0-.007 0-.011 0h-.01c-.004 0-.007 0-.011 0h-.01c-.003 0-.007 0-.01 0h-.01c-.003 0-.007 0-.01 0h-.009c-.003 0-.006 0-.009 0h-.009c-.003 0-.006 0-.009 0h-.008c-.003 0-.006 0-.009 0h-.008l-.008-.001h-.008l-.008-.001h-.007l-.008-.001h-.007l-.008-.001h-.007l-.007-.001h-.007l-.007-.001h-.006l-.007-.001h-.006l-.007-.001h-.006l-.006-.001h-.006l-.006-.001h-.006l-.006-.001h-.005l-.006-.001h-.005l-.006-.002h-.005l-.005-.001h-.005l-.005-.001h-.005l-.005-.002h-.004l-.005-.001-.005-.001-.004-.001-.005-.001-.005-.001-.004-.001-.005-.001-.004-.001-.005-.002-.004-.001-.004-.001-.005-.001-.004-.002-.004-.001-.004-.001-.004-.001-.004-.002-.004-.001-.004-.001-.004-.002-.003-.001-.004-.001-.004-.002-.003-.001-.004-.002-.003-.001-.004-.002-.003-.001-.004-.002-.003-.001-.003-.002-.003-.001-.004-.002-.003-.002-.003-.001-.003-.002-.003-.001-.003-.002-.003-.002-.003-.001-.003-.002-.003-.002-.003-.001-.003-.002-.002-.002-.003-.002-.003-.002-.002-.001-.003-.002-.002-.002-.003-.002-.002-.002-.003-.002-.002-.002-.002-.002-.003-.002-.002-.002-.002-.002-.002-.002-.002-.002-.002-.002-.002-.002-.002-.003-.002-.002-.002-.002-.002-.002-.002-.002-.002-.003-.001-.002-.002-.002-.002-.003-.001-.002-.002-.002-.002-.003-.001-.002-.002-.003-.001-.002-.002-.002-.001-.003-.001-.002-.002-.003-.001-.002-.001-.003-.001-.002-.002-.003-.001-.002-.001-.003-.001-.002-.001-.003-.001-.002-.001-.003-.001-.003-.001-.002-.001-.003-.001-.003 0-.002-.001-.003-.001-.003 0-.002-.001-.003-.001-.003 0-.002-.001-.003 0-.003-.001-.002 0-.003-.001-.003 0-.003-.001-.002 0-.003-.001-.003 0-.003-.001-.003 0-.002 0-.003-.001-.003 0-.003 0-.003-.001-.003 0-.003 0-.003-.001-.003 0-.003 0-.003-.001-.003 0-.003 0-.003 0-.003-.001-.003 0-.003 0-.004 0-.003 0-.003-.001-.003 0-.004 0-.003 0-.003 0-.004 0-.003 0-.004 0-.003 0-.004 0-.003 0-.004 0-.004 0-.003 0-.004 0-.004 0-.003 0-.004 0-.004 0-.004 0-.004 0-.003 0-.004v-.004c0-.001 0-.003 0-.004v-.004c0-.001 0-.003 0-.004v-.004c0-.001 0-.003 0-.004v-.004c0-.001 0-.003 0-.004v-.004l-.001-.004v-.004l-.001-.004v-.003l-.001-.004v-.004l-.001-.004v-.003l-.001-.004v-.004l-.001-.004v-.003l-.001-.004v-.003c0-.001 0-.003-.001-.004v-.003l-.001-.004v-.003c0-.001 0-.003-.001-.004v-.003c0-.001 0-.003-.001-.004v-.003c0-.001-.001-.003-.001-.004v-.003c0-.001-.001-.003-.001-.004v-.003c0-.001-.001-.003-.001-.003 0-.001 0-.003-.001-.004 0-.001-.001-.003-.001-.003 0-.001 0-.003-.001-.003 0-.001-.001-.003-.001-.003 0-.001-.001-.003-.001-.003 0-.001-.001-.003-.001-.003 0-.001-.001-.002-.001-.003 0-.001-.001-.003-.001-.003s-.001-.002-.001-.003c0-.001-.001-.002-.001-.003 0-.001-.001-.002-.001-.003 0-.001-.001-.002-.001-.003s-.001-.002-.001-.003c-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.002-.001-.001-.001-.002-.002-.003 0-.001-.001-.002-.001-.002-.001-.001-.001-.002-.002-.003 0-.001-.001-.002-.002-.002 0-.001-.001-.002-.002-.002 0-.001-.001-.002-.002-.003 0 0-.001-.002-.002-.002 0-.001-.001-.002-.002-.002s-.001-.002-.002-.002c0-.001-.001-.002-.002-.002s-.001-.002-.002-.002c-.001-.001-.001-.002-.002-.002-.001-.001-.001-.002-.002-.002-.001-.001-.001-.002-.002-.002-.001-.001-.001-.002-.002-.002-.001-.001-.001-.001-.002-.002-.001-.001-.001-.002-.002-.002-.001-.001-.002-.001-.002-.002-.001-.001-.001-.001-.002-.002-.001-.001-.002-.001-.002-.002-.001-.001-.001-.001-.002-.002-.001-.001-.002-.001-.002-.002-.001 0-.002-.001-.002-.002-.001 0-.002-.001-.002-.002-.001 0-.002-.001-.003-.002 0 0-.002-.001-.002-.002-.001 0-.002-.001-.003-.001-.001-.001-.002-.001-.002-.002-.001 0-.002-.001-.003-.001-.001-.001-.002-.001-.002-.002-.001 0-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.002-.001 0-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.003-.001-.003-.001-.001-.001-.002-.001-.003-.001-.001-.001-.003-.001-.003-.001-.001-.001-.003-.001-.003-.001-.001-.001-.003-.001-.003-.001-.001-.001-.003-.001-.003-.001-.001-.001-.003-.001-.003-.001-.001-.001-.003-.001-.003-.001-.002 0-.003-.001-.003-.001-.001-.001-.003-.001-.004-.001-.001 0-.003-.001-.003-.001-.002-.001-.003-.001-.004-.001-.001 0-.003-.001-.004-.001-.001 0-.003 0-.004-.001-.001 0-.003-.001-.004-.001-.001 0-.003 0-.004-.001-.001 0-.003 0-.004-.001-.002 0-.003 0-.004-.001-.002 0-.003 0-.004 0-.002-.001-.003-.001-.004-.001-.002 0-.003 0-.004 0-.002-.001-.004 0-.004-.001-.002 0-.003 0-.005 0-.001-.001-.003-.001-.004-.001-.002 0-.004 0-.005 0-.001-.001-.003-.001-.005-.001-.002 0-.003 0-.005 0-.001-.001-.004 0-.005-.001h-.004c-.002 0-.004 0-.005 0h-.005c-.001-.001-.003-.001-.005-.001h-.004c-.002 0-.004 0-.005 0h-.005c-.002 0-.004 0-.005 0h-.005c-.002 0-.004 0-.005 0h-.005c-.002 0-.004 0-.005 0h-.006c-.002 0-.004 0-.005 0h-.006c-.002 0-.004 0-.005 0h-.006c-.002 0-.004 0-.006 0h-.005c-.002 0-.004 0-.006 0h-.006l-.006.001h-.006l-.006.001h-.006l-.006.001h-.006l-.006.001h-.006l-.006.001h-.006l-.006.001-.006.001h-.006l-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.001-.006.002-.006.001-.006.001-.006.002-.006.001-.006.002-.006.001-.006.002-.006.001-.006.002-.006.002-.006.001-.005.002-.006.002-.006.002-.006.001-.006.002-.005.002-.006.002-.006.002-.005.002-.006.002-.005.002-.006.002-.005.002-.006.002-.005.002-.006.002-.005.003-.005.002-.006.002-.005.003-.005.002-.005.002-.006.003-.005.002-.005.003-.005.002-.005.003-.005.002-.005.003-.005.003-.005.002-.005.003-.005.003-.005.003-.005.003-.005.003-.005.003-.005.003-.004.003-.005.003-.005.003-.004.003-.005.003-.005.004-.004.003-.005.003-.004.004-.005.003-.004.004-.005.003-.004.004-.004.003-.005.004-.004.004-.004.004-.004.003-.004.004-.004.004-.004.004-.004.004-.004.004-.004.004-.004.004-.004.004-.004.004-.004.004-.004.004-.003.005-.004.004-.004.004-.003.005-.004.004-.003.005-.004.004-.003.005-.004.004-.003.005-.004.005-.003.005-.003.005-.004.005-.003.005-.003.005-.003.005-.003.005-.003.005-.003.005-.003.006-.003.005-.003.006-.003.005-.003.006-.002.005-.003.006-.003.006-.002.005-.003.006-.002.006-.002.006-.003.006-.002.006-.002.006-.002.006-.002.006-.002.006-.002.006-.002.007-.001.006-.002.007-.002.006-.001.007-.002.006-.001.007-.002.007-.001.007-.001.007-.002.007-.001.007-.001.007-.001.007-.001.007-.001.008-.001.007 0 .008-.001.007-.001.008 0 .008-.001.008v.008c-.001.003-.001.005-.001.008v.008c0 .003 0 .006-.001.008v.008c0 .003 0 .006-.001.009v.008c0 .003 0 .006-.001.009v.009c0 .003 0 .006-.001.009v.009c0 .003 0 .006-.001.009v.009c0 .003 0 .006-.001.009v.01c0 .003 0 .006-.001.009v10.89c0 .003.001.006.001.009v.009c0 .003 0 .006.001.009v.009c0 .003 0 .006.001.009v.009c0 .003 0 .006.001.009v.009c0 .003 0 .006.001.009v.009c0 .003 0 .006.001.009v.008c0 .003 0 .006.001.008v.008c0 .003.001.006.001.008v.008c0 .003.001.006.001.008v.008l.001.008.001.007.001.008.001.007.001.008.001.007.001.008.001.007.001.007.002.007.001.007.001.007.002.007.001.007.002.007.002.006.001.007.002.007.002.006.002.007.002.006.002.007.002.006.002.006.002.007.003.006.002.006.002.006.003.006.002.006.003.006.002.006.003.006.003.006.003.006.003.005.003.006.003.006.003.005.003.006.003.005.004.006.003.005.003.005.004.005.003.006.004.005.004.005.003.005.004.005.004.005.004.005.004.005.004.005.004.005.004.005.005.004.004.005.004.005.005.004.004.005.005.005.005.004.004.005.005.004.005.005.005.004.005.004.005.005.005.004.005.004.006.004.005.004.005.004.006.004.005.004.006.004.006.004.005.004.006.004.006.003.006.004.006.004.006.003.006.004.006.003.007.004.006.003.006.003.007.004.006.003.007.003.007.003.006.003.007.003.007.003.007.003.007.003.007.003.007.003.007.003.007.003.007.002.008.003.007.003.008.002.007.003.008.002.008.003.007.002.008.002.008.003.008.002.008.002.008.002.008.002.008.002.008.002.009.002.008.002.008.002.009.002.008.001.009.002.009.002.008.001.009.002.009.001.009.002.009.001.009.001.009.002.009.001.01.001.009.001.009.001.01.001.009.001.01.001.009.001.01 0 .01.001.01 0 .01.001.01v.01c.001.003.001.007.001.01V18c0 2.206-1.794 4-4 4H8c-2.206 0-4-1.794-4-4V6c0-2.206 1.794-4 4-4h7.52l-.001.002h.001c.011 0 .022.002.033.003h.003c.01.001.021.002.031.004h.002c.01.001.02.003.031.005.001 0 .001 0 .002.001.01.002.02.004.03.006 0 0 .001 0 .002.001.01.002.019.005.029.008 0 0 .001 0 .002.001.009.003.019.005.028.009 0 0 .001 0 .002.001.009.003.018.006.027.01.001 0 .001.001.002.001.009.004.017.007.026.011.001 0 .001.001.002.001.008.004.017.008.025.013 0 0 .001.001.002.001.008.004.016.009.024.014 0 .001.001.001.002.002.008.004.015.009.023.014.001.001.001.001.002.002.008.005.015.01.022.015.001.001.001.001.002.002.007.005.014.01.021.016.001.001.001.001.002.002l5.25 4.125c.001.001.001.001.002.002.007.006.014.011.02.017.001.001.001.001.002.002.007.006.013.012.019.018l.002.002c.006.006.012.012.018.019l.002.002c.006.006.012.013.017.019l.002.003c.005.006.011.013.016.02l.002.003c.005.007.01.013.015.02l.001.003c.005.007.009.014.014.021l.001.003c.004.007.009.014.013.022l.001.003c.004.007.008.015.012.022l.001.003c.004.008.007.015.011.023l.001.004c.003.008.006.015.009.023l.001.004c.003.008.006.016.008.024 0 .001.001.003.001.004.002.008.005.016.007.024 0 .002 0 .003.001.005.002.008.004.016.006.025 0 .001 0 .003.001.004.002.009.003.017.005.026 0 .001 0 .003 0 .004.002.009.003.018.004.026 0 .002 0 .003 0 .005.001.009.002.018.003.027 0 .002 0 .003 0 .005.001.009.002.018.002.027 0 .002 0 .004 0 .005.001.01.001.019.001.028v.006c0 .01 0 .019 0 .028v11.06c0 .009 0 .019-.001.028v.005c-.001.009-.001.019-.002.028 0 .002 0 .003 0 .005-.001.009-.002.018-.003.027 0 .002 0 .003 0 .005-.001.009-.002.017-.004.026 0 .001 0 .003 0 .004-.002.009-.003.018-.005.026 0 .002 0 .003-.001.005-.002.008-.004.016-.006.024-.001.002-.001.003-.001.005-.002.008-.005.016-.007.024-.001.001-.001.003-.001.004-.003.008-.005.016-.008.024-.001.001-.001.003-.001.004-.003.008-.006.015-.009.023l-.001.004c-.003.008-.007.015-.011.023l-.001.003c-.004.007-.008.015-.012.022l-.001.003c-.004.007-.009.014-.013.021l-.002.003c-.004.007-.009.014-.014.021l-.001.003c-.005.007-.01.013-.015.02l-.002.003c-.005.007-.011.013-.016.02l-.002.002c-.006.006-.011.013-.017.019l-.002.002c-.006.006-.012.012-.018.018l-.002.002c-.006.006-.013.012-.02.017l-.001.002c-.007.006-.014.011-.021.016l-.002.002c-.007.005-.014.01-.022.015l-.002.002c-.008.005-.015.01-.023.014l-.002.002c-.008.005-.016.009-.024.014l-.002.001c-.008.004-.017.008-.025.012l-.002.001c-.009.004-.017.008-.026.011l-.002.001c-.009.004-.018.007-.027.01l-.002.001c-.009.003-.019.006-.028.008l-.002.001c-.01.003-.019.005-.029.007l-.002.001c-.01.002-.02.004-.031.005l-.002.001c-.01.002-.021.003-.031.004l-.003.001c-.011.001-.022.002-.032.002h-.004H15.5v-3.52c0-1.654-1.346-3-3-3s-3 1.346-3 3V22H8c-3.309 0-6-2.691-6-6V6c0-3.309 2.691-6 6-6h7.52c.003 0 .006.001.01.001.003 0 .006 0 .01.001.003 0 .006 0 .01.001.003 0 .006 0 .009.001.003 0 .006 0 .01.001.003 0 .006 0 .009.001.003 0 .006.001.009.001.003 0 .006 0 .009.001.003 0 .006.001.009.001.003 0 .006.001.009.001.003.001.006.001.009.001.003.001.006.001.009.001.003.001.005.001.008.002.003 0 .006.001.009.001.003.001.005.001.008.002.003.001.006.001.008.002.003 0 .006.001.008.002.003.001.005.001.008.002.003.001.005.001.008.002.003.001.005.001.008.002.003.001.005.002.008.002.002.001.005.001.008.002.002.001.005.002.007.002.003.001.005.002.008.002.002.001.005.002.007.003.003.001.005.002.007.002.003.001.005.002.007.003.003.001.005.002.007.003.003.001.005.002.007.003.002.001.005.002.007.003.002.001.005.002.007.003.002.001.005.002.007.003.002.001.004.002.007.003.002.001.004.002.007.003.002.002.004.002.006.004.003.001.005.002.007.003.002.001.004.002.006.004.002.001.005.002.007.004.002.001.004.002.006.004.002.001.004.002.006.004.002.001.004.003.006.004.002.001.004.002.006.004.002.002.004.002.006.004.002.001.004.003.006.004.002.002.004.003.006.004.002.002.003.003.005.004.002.002.004.003.006.004.002.002.003.003.005.005.002.001.004.003.005.004.002.002.004.003.005.005.002.002.003.003.005.005.002.002.003.003.005.005.002.002.003.003.005.005.001.002.003.003.005.005.001.002.003.003.005.005.001.002.003.003.004.005.002.002.003.003.005.005.001.002.003.003.004.005.002.002.003.004.004.005.002.002.003.003.004.005.001.002.003.004.004.005.001.002.003.004.004.006.001.002.003.003.004.005.001.002.002.004.004.006.001.002.002.003.004.005.001.002.002.004.003.006.002.002.002.004.004.006.001.002.002.004.003.006.001.002.002.004.003.006.001.002.002.004.003.006.001.002.002.004.003.006.001.002.002.004.003.006.001.002.002.004.003.006.001.002.002.004.002.006.001.002.002.004.003.006 0 .002.002.004.002.006.001.002.002.004.003.007 0 .002.001.004.002.006.001.002.002.004.002.006.001.003.002.004.002.007.001.002.001.004.002.006.001.002.001.005.002.007 0 .002.001.004.002.006 0 .003.001.004.002.007 0 .002.001.005.001.007.001.002.001.004.002.007 0 .002.001.004.001.007.001.002.001.005.001.007.001.002.001.004.001.007.001.002.001.005.001.007.001.003 0 .005.001.007.001.003 0 .005.001.007.001.003 0 .005.001.007 0 .003.001.005.001.008 0 .002 0 .005.001.007 0 .003 0 .005 0 .008.001.002 0 .005.001.008 0 .002 0 .005 0 .008 0 .003 0 .005 0 .008.001.003 0 .006 0 .008 0 .003 0 .006 0 .009 0 .003 0 .006 0 .009 0 .003 0 .006 0 .009z"/>
    </svg>
  ),
  website: Globe,
}

const socialLabels = {
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  youtube: 'YouTube',
  spotify: 'Spotify',
  tiktok: 'TikTok',
  soundcloud: 'SoundCloud',
  appleMusic: 'Apple Music',
  website: 'Website',
}

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '')

// Custom tooltip for charts
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 border border-border rounded-lg px-3 py-2 shadow-lg">
        <p className="text-sm font-medium">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-primary">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    )
  }
  return null
}

// Format duration from ms to mm:ss
function formatDuration(ms) {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function UserProfilePage({ profileSlug, isOwnProfile = false }) {
  const navigate = useNavigate()
  const { user, featuredPlaylist, isApproved } = useAuth()
  const [copied, setCopied] = useState(false)
  const [fetchedProfile, setFetchedProfile] = useState(null)
  const [spotifyData, setSpotifyData] = useState(null)
  const [eventsData, setEventsData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [singlesVisible, setSinglesVisible] = useState(12)

  // Fetch profile data for public profiles
  useEffect(() => {
    if (isOwnProfile || !profileSlug) {
      setFetchedProfile(null)
      setSpotifyData(null)
      setEventsData([])
      setSinglesVisible(12)
      return
    }

    const fetchProfile = async () => {
      setLoading(true)
      setError(null)
      setSinglesVisible(12) // Reset lazy loading on new profile
      try {
        const response = await fetch(`${API_URL}/api/profile/${profileSlug}`)
        if (!response.ok) {
          throw new Error('Profile not found')
        }
        const data = await response.json()
        setFetchedProfile(data.profile)
        setSpotifyData(data.spotifyData)
        setEventsData(data.events || [])
      } catch (err) {
        console.error('Failed to fetch profile:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [profileSlug, isOwnProfile])

  // Use own profile data or fetched profile data
  const profileData = isOwnProfile ? user : fetchedProfile

  // Show loading state for public profiles
  if (!isOwnProfile && loading) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData || error) {
    return (
      <div className="min-h-screen bg-background pt-20 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-6">
            This profile doesn't exist or hasn't been approved yet.
          </p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  // Determine if this is a verified/approved artist
  const isVerifiedArtist = profileData.status === 'APPROVED'

  // Transform individual URL fields to socialLinks object for consistency
  const socialLinksFromProfile = {
    ...(profileData.instagramUrl && { instagram: profileData.instagramUrl }),
    ...(profileData.twitterUrl && { twitter: profileData.twitterUrl }),
    ...(profileData.websiteUrl && { website: profileData.websiteUrl }),
    ...(profileData.spotifyUrl && { spotify: profileData.spotifyUrl }),
  }

  // Use socialLinks from profile data or construct from individual fields
  const socialLinks = profileData.socialLinks || socialLinksFromProfile

  // Map avatar field (database uses 'avatar', component may expect 'profileImage')
  const profileImage = profileData.profileImage || profileData.avatar

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/${profileData.profileSlug}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const textArea = document.createElement('textarea')
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const activeSocialLinks = Object.entries(socialLinks)
    .filter(([, value]) => value && value.trim())

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Hero Section */}
      <div className="relative">
        {/* Header Image / Gradient - Use album art or profile image as blurred banner */}
        <div className="h-48 md:h-64 relative overflow-hidden">
          {profileData.headerImage ? (
            <img
              src={profileData.headerImage}
              alt="Header"
              className="w-full h-full object-cover"
            />
          ) : spotifyData?.latestReleases?.[0]?.image || profileImage ? (
            <>
              <img
                src={spotifyData?.latestReleases?.[0]?.image || profileImage}
                alt="Header"
                className="w-full h-full object-cover scale-110 blur-2xl opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-primary/30 via-primary/10 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 -mt-24">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-4 border-background flex-shrink-0 glow-green"
            >
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={profileData.artistName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <Music className="w-16 h-16 text-muted-foreground" />
                </div>
              )}
            </motion.div>

            {/* Profile Info */}
            <div className="flex-1 pb-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="gap-1">
                    <MapPin className="w-3 h-3" />
                    {profileData.region || 'Tampa Bay'}
                  </Badge>
                  {isVerifiedArtist && (
                    <Badge className="gap-1 bg-primary/20 text-primary border-primary/30">
                      <CheckCircle2 className="w-3 h-3" />
                      Verified Artist
                    </Badge>
                  )}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {profileData.artistName}
                </h1>

                {profileData.bio && (
                  <p className="text-muted-foreground max-w-xl mb-4">
                    {profileData.bio}
                  </p>
                )}

                {/* Genres - from Spotify data */}
                {(spotifyData?.genres?.length > 0 || profileData.genres?.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(spotifyData?.genres || profileData.genres || []).map((genre) => (
                      <Badge key={genre} variant="secondary" className="capitalize">
                        {genre}
                      </Badge>
                    ))}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pb-4">
              {isOwnProfile && (
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => navigate('/settings')}
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </Button>
              )}
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="music" className="gap-2">
              <Music className="w-4 h-4" />
              Music
            </TabsTrigger>
            <TabsTrigger value="gallery" className="gap-2">
              <Image className="w-4 h-4" />
              Gallery
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2">
              <Calendar className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="links" className="gap-2">
              <Globe className="w-4 h-4" />
              Links
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            {spotifyData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <Card className="glow-green-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {spotifyData.followers?.toLocaleString() || '0'}
                          </div>
                          <div className="text-sm text-muted-foreground">Followers</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="glow-green-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <TrendingUp className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {spotifyData.popularity || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Popularity</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="glow-green-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Album className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {spotifyData.totalAlbums || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Albums</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="glow-green-sm">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Mic2 className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-primary">
                            {spotifyData.totalSingles || 0}
                          </div>
                          <div className="text-sm text-muted-foreground">Singles</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Popularity Chart */}
            {spotifyData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Artist Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Popularity Gauge */}
                    <div className="flex flex-col items-center">
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Spotify Popularity Score</h4>
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="60%"
                            outerRadius="90%"
                            barSize={20}
                            data={[{ name: 'Popularity', value: spotifyData.popularity, fill: '#22c55e' }]}
                            startAngle={180}
                            endAngle={0}
                          >
                            <RadialBar
                              background={{ fill: '#27272a' }}
                              dataKey="value"
                              cornerRadius={10}
                            />
                          </RadialBarChart>
                        </ResponsiveContainer>
                        <div className="text-center -mt-20">
                          <div className="text-4xl font-bold text-primary">{spotifyData.popularity}</div>
                          <div className="text-sm text-muted-foreground">out of 100</div>
                        </div>
                      </div>
                    </div>

                    {/* Top Tracks Popularity */}
                    {spotifyData.topTracks?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-4">Top Tracks Popularity</h4>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={spotifyData.topTracks.slice(0, 5).map(t => ({
                                name: t.name.length > 15 ? t.name.substring(0, 15) + '...' : t.name,
                                popularity: t.popularity
                              }))}
                              layout="vertical"
                              margin={{ left: 0, right: 20 }}
                            >
                              <XAxis type="number" domain={[0, 100]} stroke="#71717a" fontSize={12} />
                              <YAxis type="category" dataKey="name" width={100} stroke="#71717a" fontSize={11} />
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="popularity" radius={[0, 4, 4, 0]}>
                                {spotifyData.topTracks.slice(0, 5).map((_, index) => (
                                  <Cell key={index} fill={index === 0 ? '#22c55e' : '#22c55e80'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Latest Release Highlight */}
            {spotifyData?.latestReleases?.[0] && (
              <Card className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Latest Release
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex flex-col md:flex-row items-center gap-6 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-transparent cursor-pointer hover:from-primary/20 transition-colors"
                    onClick={() => window.open(spotifyData.latestReleases[0].url, '_blank')}
                  >
                    <img
                      src={spotifyData.latestReleases[0].image}
                      alt={spotifyData.latestReleases[0].name}
                      className="w-40 h-40 rounded-lg shadow-2xl"
                    />
                    <div className="flex-1 text-center md:text-left">
                      <Badge variant="outline" className="mb-2 capitalize">
                        {spotifyData.latestReleases[0].type}
                      </Badge>
                      <h3 className="text-2xl font-bold mb-2">{spotifyData.latestReleases[0].name}</h3>
                      <p className="text-muted-foreground mb-4">
                        Released {new Date(spotifyData.latestReleases[0].releaseDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <div className="flex items-center gap-4 justify-center md:justify-start">
                        <Badge variant="secondary">
                          {spotifyData.latestReleases[0].totalTracks} track{spotifyData.latestReleases[0].totalTracks !== 1 ? 's' : ''}
                        </Badge>
                        <Button size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          Listen on Spotify
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Social Links Preview */}
            {activeSocialLinks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary" />
                    Connect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {activeSocialLinks.map(([platform, url]) => {
                      const Icon = socialIcons[platform] || Globe
                      return (
                        <Button
                          key={platform}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <Icon className="w-4 h-4" />
                          {socialLabels[platform] || platform}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* No Spotify Data Message */}
            {!spotifyData && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Spotify Data</h3>
                  <p className="text-muted-foreground">
                    This artist hasn't linked their Spotify profile yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-6">
            {spotifyData ? (
              <>
                {/* Top Tracks */}
                {spotifyData.topTracks?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Headphones className="w-5 h-5 text-primary" />
                        Top Tracks
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {spotifyData.topTracks.map((track, index) => (
                          <motion.div
                            key={track.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer group"
                            onClick={() => window.open(track.url, '_blank')}
                          >
                            <span className="w-6 text-center text-muted-foreground font-medium">
                              {index + 1}
                            </span>
                            <img
                              src={track.albumImage}
                              alt={track.albumName}
                              className="w-12 h-12 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{track.name}</div>
                              <div className="text-sm text-muted-foreground truncate">{track.albumName}</div>
                            </div>
                            <div className="hidden md:flex items-center gap-4">
                              <div className="w-24">
                                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary rounded-full"
                                    style={{ width: `${track.popularity}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm text-muted-foreground w-12">
                                {formatDuration(track.duration)}
                              </span>
                            </div>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <Play className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Albums */}
                {spotifyData.discography?.albums?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Album className="w-5 h-5 text-primary" />
                        Albums
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {spotifyData.discography.albums.map((album, index) => (
                          <motion.div
                            key={album.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="group cursor-pointer"
                            onClick={() => window.open(album.url, '_blank')}
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden mb-3">
                              <img
                                src={album.image}
                                alt={album.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-12 h-12 text-white" />
                              </div>
                            </div>
                            <h4 className="font-medium truncate">{album.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(album.releaseDate).getFullYear()} · {album.totalTracks} tracks
                            </p>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Singles & EPs */}
                {spotifyData.discography?.singles?.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Disc3 className="w-5 h-5 text-primary" />
                        Singles & EPs
                        <Badge variant="secondary" className="ml-2">
                          {spotifyData.discography.singles.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {spotifyData.discography.singles.slice(0, singlesVisible).map((single, index) => (
                          <motion.div
                            key={single.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index, 11) * 0.03 }}
                            className="group cursor-pointer"
                            onClick={() => window.open(single.url, '_blank')}
                          >
                            <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                              <img
                                src={single.image}
                                alt={single.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Play className="w-8 h-8 text-white" />
                              </div>
                            </div>
                            <h4 className="font-medium text-sm truncate">{single.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {new Date(single.releaseDate).getFullYear()}
                            </p>
                          </motion.div>
                        ))}
                      </div>
                      {spotifyData.discography.singles.length > singlesVisible && (
                        <div className="flex justify-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setSinglesVisible(prev => prev + 12)}
                            className="gap-2"
                          >
                            <ListMusic className="w-4 h-4" />
                            Load More ({spotifyData.discography.singles.length - singlesVisible} remaining)
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Disc3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Music Data</h3>
                  <p className="text-muted-foreground mb-4">
                    Connect a Spotify artist profile to display music here.
                  </p>
                  {isOwnProfile && (
                    <Button onClick={() => navigate('/settings')} className="gap-2">
                      <Settings className="w-4 h-4" />
                      Go to Settings
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery">
            {spotifyData?.latestReleases?.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Image className="w-5 h-5 text-primary" />
                    Album Artwork Gallery
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Collect all unique album art */}
                    {[
                      ...new Map(
                        [...(spotifyData.discography?.albums || []), ...(spotifyData.discography?.singles || [])]
                          .filter(item => item.image)
                          .map(item => [item.image, item])
                      ).values()
                    ].slice(0, 16).map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="group cursor-pointer relative aspect-square"
                        onClick={() => window.open(item.url, '_blank')}
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-end p-3">
                          <div>
                            <h4 className="font-medium text-white text-sm truncate">{item.name}</h4>
                            <p className="text-xs text-white/70">{new Date(item.releaseDate).getFullYear()}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Image className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Gallery Images</h3>
                  <p className="text-muted-foreground">
                    Album artwork will appear here once Spotify data is connected.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming Events
                  {eventsData.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {eventsData.length} show{eventsData.length !== 1 ? 's' : ''}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {eventsData.length > 0 ? (
                  <div className="space-y-4">
                    {eventsData
                      .filter(event => event.date && new Date(event.date) >= new Date(new Date().toDateString()))
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event, index) => (
                        <motion.div
                          key={event.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10 flex-shrink-0">
                            <span className="text-xs text-muted-foreground uppercase">
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {new Date(event.date + 'T00:00:00').getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{event.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.venue}
                              </span>
                              {event.location && event.location !== event.venue && (
                                <span className="text-muted-foreground">
                                  {event.location}
                                </span>
                              )}
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </span>
                              )}
                            </div>
                            {event.lineup && event.lineup.length > 1 && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Also featuring: {event.lineup.slice(1).join(', ')}
                              </p>
                            )}
                          </div>
                          {event.ticketUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(event.ticketUrl, '_blank')}
                              className="gap-1 flex-shrink-0"
                            >
                              <Ticket className="w-3 h-3" />
                              Tickets
                            </Button>
                          )}
                        </motion.div>
                      ))}
                  </div>
                ) : (profileData.events || []).length > 0 ? (
                  // Fallback to profile events (user-added)
                  <div className="space-y-4">
                    {profileData.events
                      .filter(event => new Date(event.date) >= new Date(new Date().toDateString()))
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map((event) => (
                        <div
                          key={event.id}
                          className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                        >
                          <div className="flex flex-col items-center justify-center w-16 h-16 rounded-lg bg-primary/10 flex-shrink-0">
                            <span className="text-xs text-muted-foreground uppercase">
                              {new Date(event.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                            <span className="text-xl font-bold text-primary">
                              {new Date(event.date + 'T00:00:00').getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold">{event.title}</h4>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {event.venue}
                              </span>
                              {event.time && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {event.time}
                                </span>
                              )}
                              {event.price && (
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Ticket className="w-3 h-3" />
                                  {event.price}
                                </Badge>
                              )}
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {event.ticketUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(event.ticketUrl, '_blank')}
                              className="gap-1 flex-shrink-0"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Tickets
                            </Button>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No upcoming events found.</p>
                    <p className="text-sm text-muted-foreground">
                      Events are automatically fetched from Bandsintown when available.
                    </p>
                    {isOwnProfile && (
                      <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2 mt-4">
                        <Edit3 className="w-4 h-4" />
                        Add Events
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  All Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activeSocialLinks.length > 0 ? (
                  <div className="space-y-3">
                    {activeSocialLinks.map(([platform, url]) => {
                      const Icon = socialIcons[platform] || Globe
                      return (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{socialLabels[platform] || platform}</div>
                            <div className="text-sm text-muted-foreground truncate max-w-xs">
                              {url}
                            </div>
                          </div>
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        </a>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Link className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No social links added yet.</p>
                    {isOwnProfile && (
                      <Button onClick={() => navigate('/settings')} variant="outline" className="gap-2">
                        <Edit3 className="w-4 h-4" />
                        Add Links
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
