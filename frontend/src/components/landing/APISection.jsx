import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Cloud,
  Zap,
  RefreshCw,
  Shield,
  ChevronRight,
  ExternalLink,
  Play
} from 'lucide-react'

const platforms = [
  {
    name: 'Spotify',
    color: '#1db954',
    bgColor: 'bg-[#1db954]/10',
    borderColor: 'border-[#1db954]/30',
    textColor: 'text-[#1db954]',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
      </svg>
    ),
    metrics: ['Streams', 'Listeners', 'Followers', 'Playlist Adds']
  },
  {
    name: 'Apple Music',
    color: '#fa243c',
    bgColor: 'bg-[#fa243c]/10',
    borderColor: 'border-[#fa243c]/30',
    textColor: 'text-[#fa243c]',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.99c-.042.003-.083.01-.124.013-.5.032-.999.09-1.486.198a4.94 4.94 0 00-1.955.84C1.332 1.965.633 3.107.336 4.484a10.46 10.46 0 00-.18 1.622c-.003.04-.01.083-.013.124v11.54c.003.042.01.083.013.124.032.5.09.999.198 1.486.311 1.31 1.062 2.31 2.18 3.043.544.358 1.147.6 1.796.748.498.115 1.006.17 1.518.19.042.003.083.01.124.013h12.02c.042-.003.083-.01.124-.013a9.225 9.225 0 002.19-.24c1.31-.317 2.31-1.062 3.043-2.18a5.022 5.022 0 00.726-1.877c.115-.498.17-1.006.19-1.518.003-.042.01-.083.013-.124V6.248c-.003-.042-.01-.083-.013-.124zM17.03 17.91c-.063.144-.13.283-.2.418-.355.683-.846 1.188-1.52 1.487-.378.168-.778.255-1.19.255-.29 0-.583-.04-.87-.118a3.2 3.2 0 01-.853-.354c-.287-.175-.55-.384-.788-.626-.238-.242-.444-.512-.615-.808-.17-.296-.302-.617-.393-.957a4.163 4.163 0 01-.138-1.065c0-.345.046-.68.138-1.005.092-.324.224-.633.393-.928.17-.295.377-.565.615-.806.238-.242.5-.45.788-.626.287-.175.598-.316.93-.423.33-.107.68-.16 1.05-.16.435 0 .854.085 1.256.257.403.17.761.41 1.072.72V9.74c0-.04.013-.074.038-.1a.135.135 0 01.1-.038h1.42c.04 0 .073.013.1.038a.136.136 0 01.037.1v7.35c0 .29-.047.57-.142.84z"/>
      </svg>
    ),
    metrics: ['Plays', 'Shazams', 'Radio Spins', 'Playlist Reach']
  },
  {
    name: 'YouTube',
    color: '#ff0000',
    bgColor: 'bg-[#ff0000]/10',
    borderColor: 'border-[#ff0000]/30',
    textColor: 'text-[#ff0000]',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
    metrics: ['Views', 'Watch Time', 'Subscribers', 'Engagement']
  },
  {
    name: 'SoundCloud',
    color: '#ff5500',
    bgColor: 'bg-[#ff5500]/10',
    borderColor: 'border-[#ff5500]/30',
    textColor: 'text-[#ff5500]',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1m-.899.828c-.06 0-.091.037-.104.094L0 14.479l.165 1.308c0 .055.045.094.09.094s.089-.045.104-.104l.21-1.319-.21-1.334c0-.061-.044-.09-.09-.09m1.83-1.229c-.061 0-.12.045-.12.104l-.21 2.563.225 2.458c0 .06.045.12.119.12.061 0 .105-.061.121-.12l.254-2.474-.254-2.548c-.016-.06-.061-.12-.121-.12m.945-.089c-.075 0-.135.06-.15.135l-.193 2.64.21 2.544c.016.077.075.138.149.138.075 0 .135-.061.15-.15l.24-2.532-.24-2.623c0-.075-.06-.135-.135-.135m1.155.36c-.005-.09-.075-.149-.159-.149-.09 0-.158.06-.164.149l-.217 2.43.2 2.563c0 .09.075.157.159.157.074 0 .148-.068.148-.158l.227-2.563-.227-2.444m.809-1.709c-.101 0-.18.09-.18.181l-.21 3.957.187 2.563c0 .09.08.164.18.164.094 0 .174-.09.18-.18l.209-2.563-.209-3.972c-.008-.104-.088-.18-.18-.18m.959-.914c-.105 0-.195.09-.203.194l-.18 4.872.165 2.548c0 .12.09.209.195.209.104 0 .194-.089.21-.209l.193-2.548-.193-4.856c-.016-.12-.105-.21-.21-.21m.989-.449c-.121 0-.211.089-.225.209l-.165 5.275.165 2.52c.014.119.104.225.225.225.119 0 .225-.105.225-.225l.195-2.52-.196-5.275c0-.12-.105-.209-.225-.209m1.245.045c0-.135-.105-.24-.24-.24-.119 0-.24.105-.24.24l-.149 5.441.149 2.503c.016.135.121.24.256.24s.24-.105.24-.24l.164-2.503-.164-5.456m.749-.344c-.135 0-.255.119-.255.254l-.15 5.738.15 2.489c0 .15.12.255.255.255s.255-.12.255-.27l.15-2.489-.165-5.738c0-.135-.12-.254-.255-.254m1.005.014c-.15 0-.27.135-.27.27l-.135 5.724.135 2.474c0 .149.12.27.27.285.135 0 .27-.12.27-.285l.135-2.474-.135-5.739c0-.135-.12-.27-.27-.27m.989.134c-.164 0-.284.135-.284.285l-.105 5.605.12 2.459c0 .164.12.3.285.3.15 0 .285-.135.285-.285l.12-2.474-.135-5.605c0-.164-.135-.3-.285-.3m1.021-.073c-.181 0-.301.135-.316.3l-.09 5.596.105 2.444c0 .165.135.3.3.315.164 0 .3-.15.3-.315l.12-2.444-.12-5.596c-.014-.164-.149-.3-.314-.3m1.139.134c-.195 0-.33.15-.345.315L12 12.36l.105 2.414c0 .18.149.33.33.33.164 0 .314-.15.329-.315l.09-2.429-.09-5.369c-.014-.18-.165-.33-.33-.33m1.139-.134c-.209 0-.36.165-.375.345l-.074 5.504.089 2.384c.016.195.166.36.361.36.18 0 .33-.165.345-.36l.104-2.384-.104-5.489c0-.195-.15-.36-.346-.36m3.449 2.699c-.255-.12-.54-.181-.84-.181-.285 0-.555.061-.825.181-.135-.643-.344-1.215-.644-1.698-.299-.494-.689-.919-1.169-1.274-.48-.359-1.035-.614-1.65-.779-.615-.165-1.32-.254-2.07-.254-.21 0-.405.015-.585.045-.195.03-.345.2-.345.4v10.228c0 .214.18.39.39.405h7.41c.599 0 1.155-.18 1.65-.539.494-.359.84-.854 1.02-1.469.179-.614.164-1.244-.045-1.859-.21-.614-.586-1.124-1.126-1.469m-.255 3.328c-.285.165-.611.255-.959.255h-5.939V8.146c.24-.045.494-.075.779-.075.57 0 1.08.09 1.53.271.449.18.84.434 1.154.764.315.33.554.72.72 1.17.164.449.255.93.255 1.439.014.6-.12 1.141-.405 1.621-.286.48-.675.854-1.17 1.124.181.135.345.285.495.449.255.285.449.6.584.959.135.359.18.734.135 1.125-.044.404-.165.764-.359 1.08z"/>
      </svg>
    ),
    metrics: ['Plays', 'Reposts', 'Likes', 'Comments']
  },
  {
    name: 'Deezer',
    color: '#feaa2d',
    bgColor: 'bg-[#feaa2d]/10',
    borderColor: 'border-[#feaa2d]/30',
    textColor: 'text-[#feaa2d]',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.81 4.16v3.03H24V4.16h-5.19zM6.27 8.38v3.027h5.189V8.38h-5.19zm12.54 0v3.027H24V8.38h-5.19zM6.27 12.566v3.027h5.189v-3.027h-5.19zm6.27 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19zM0 16.752v3.027h5.19v-3.027H0zm6.27 0v3.027h5.189v-3.027h-5.19zm6.27 0v3.027h5.19v-3.027h-5.19zm6.27 0v3.027H24v-3.027h-5.19z"/>
      </svg>
    ),
    metrics: ['Streams', 'Fans', 'Charts', 'Playlists']
  },
  {
    name: 'Audius',
    color: '#cc0fe0',
    bgColor: 'bg-[#cc0fe0]/10',
    borderColor: 'border-[#cc0fe0]/30',
    textColor: 'text-[#cc0fe0]',
    logo: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 16.667c-.217.359-.612.573-1.031.573h-2.135v-5.08h-5.456v5.08H7.137c-.42 0-.814-.214-1.031-.573a1.196 1.196 0 01.016-1.192L10.99 6.65c.22-.369.62-.6 1.055-.6s.836.231 1.055.6l4.778 8.825c.22.407.204.865.016 1.192z"/>
      </svg>
    ),
    metrics: ['Plays', '$AUDIO Tips', 'Followers', 'Reposts']
  },
]

const apiFeatures = [
  {
    icon: Zap,
    title: 'Real-Time Sync',
    description: 'Data updates every 5 minutes from all platforms'
  },
  {
    icon: RefreshCw,
    title: 'Unified API',
    description: 'One endpoint for all streaming platform data'
  },
  {
    icon: Shield,
    title: 'Enterprise Ready',
    description: 'Rate limiting, caching, and 99.9% uptime SLA'
  },
]

export function APISection() {
  return (
    <section id="api" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge variant="outline" className="mb-4">
            <Cloud className="w-4 h-4 mr-1" />
            Platform Integrations
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Powered by <span className="text-gradient">Every Platform</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We aggregate data from Spotify, Apple Music, YouTube, SoundCloud, Deezer, and Audius to give you the complete picture.
          </p>
        </motion.div>

        {/* Platform Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <Card className={`h-full ${platform.bgColor} ${platform.borderColor} border hover:glow-green-sm transition-all cursor-pointer group`}>
                <CardContent className="p-4 text-center">
                  <div className={`${platform.textColor} mb-2 flex justify-center`}>
                    {platform.logo}
                  </div>
                  <h3 className="font-semibold text-sm mb-2">{platform.name}</h3>
                  <div className="space-y-1">
                    {platform.metrics.slice(0, 2).map((metric) => (
                      <Badge key={metric} variant="secondary" className="text-xs w-full justify-center">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Total Views Display */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden glow-green-sm">
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2">
                {/* Left: Stats */}
                <div className="p-8 lg:p-12">
                  <h3 className="text-3xl font-bold mb-4">
                    See the <span className="text-gradient">Full Picture</span>
                  </h3>
                  <p className="text-muted-foreground mb-8">
                    We combine data from all platforms to show you true total views, streams, and engagement metrics that you can't get anywhere else.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-gradient mb-1">1.2B+</div>
                      <div className="text-sm text-muted-foreground">Total Views Tracked</div>
                    </div>
                    <div className="glass rounded-xl p-4 text-center">
                      <div className="text-3xl font-bold text-gradient mb-1">6</div>
                      <div className="text-sm text-muted-foreground">Platforms Integrated</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {apiFeatures.map((feature) => {
                      const Icon = feature.icon
                      return (
                        <div key={feature.title} className="flex gap-3">
                          <Icon className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="font-medium">{feature.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {feature.description}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Right: Code Preview */}
                <div className="bg-secondary/50 p-8 lg:p-12 border-l border-border">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary">API Preview</Badge>
                    <Button variant="ghost" size="sm" className="gap-1">
                      View Docs <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-background rounded-lg p-4 overflow-x-auto">
                    <pre className="text-muted-foreground">
{`GET /api/v1/artist/{id}/stats

{
  "artist": "Tampa Flow",
  "total_streams": 12400000,
  "platforms": {
    "spotify": 6200000,
    "apple": 2800000,
    "youtube": 2100000,
    "soundcloud": 890000,
    "deezer": 310000,
    "audius": 100000
  },
  "chart_position": 7,
  "trending": true
}`}
                    </pre>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" className="gap-1">
                      <Play className="w-4 h-4" />
                      Try It
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1">
                      Get API Key
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  )
}
