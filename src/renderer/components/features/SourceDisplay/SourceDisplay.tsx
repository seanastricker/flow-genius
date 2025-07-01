/**
 * Source Display Component - Shows research sources with credibility indicators
 * 
 * Displays source citations with credibility scores, relevance ratings,
 * and provides links to original sources for verification.
 */
import React, { useState } from 'react';
import { Button } from '../../ui/button';
import { Card } from '../../ui/card';
import type { ResearchSource, ExpertSection } from '../../../stores/document-store';

interface SourceDisplayProps {
  sources: ResearchSource[];
  expertInfo?: ExpertSection['expert'];
}

/**
 * Component for displaying research sources with credibility indicators
 */
export function SourceDisplay({ sources, expertInfo }: SourceDisplayProps) {
  const [expandedSource, setExpandedSource] = useState<string | null>(null);

  const getCredibilityColor = (score: number) => {
    if (score >= 8) return 'text-green-600 bg-green-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCredibilityLabel = (score: number) => {
    if (score >= 8) return 'High';
    if (score >= 6) return 'Medium';
    return 'Low';
  };

  const getSourceTypeIcon = (type: ResearchSource['sourceType']) => {
    switch (type) {
      case 'academic': return '🎓';
      case 'industry': return '🏢';
      case 'news': return '📰';
      case 'blog': return '📝';
      default: return '🔗';
    }
  };

  const toggleExpanded = (sourceId: string) => {
    setExpandedSource(expandedSource === sourceId ? null : sourceId);
  };

  const openExternalLink = (url: string) => {
    // In Electron, we'll use the main process to open external links
    if (window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(url);
    } else {
      // Fallback for development
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      {/* Expert Info (if provided) */}
      {expertInfo && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h4 className="font-medium text-blue-900 mb-2">Expert Profile</h4>
          <div className="space-y-1 text-sm">
            <div><span className="font-medium">Name:</span> {expertInfo.name}</div>
            <div><span className="font-medium">Title:</span> {expertInfo.title}</div>
            <div><span className="font-medium">Focus:</span> {expertInfo.focusArea}</div>
            <div><span className="font-medium">Relevance:</span> {expertInfo.relevance}</div>
            {expertInfo.publicProfiles.length > 0 && (
              <div className="mt-2">
                <span className="font-medium">Profiles:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {expertInfo.publicProfiles.map((profile, index) => (
                    <Button
                      key={index}
                      size="sm"
                      variant="outline"
                      onClick={() => openExternalLink(profile)}
                      className="text-xs"
                    >
                      View Profile
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Sources Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-slate-900">
          Research Sources ({sources.length})
        </h4>
        <div className="text-xs text-slate-500">
          Average credibility: {sources.length > 0 ? (sources.reduce((sum, s) => sum + s.credibilityScore, 0) / sources.length).toFixed(1) : 'N/A'}
        </div>
      </div>

      {/* Sources List */}
      {sources.length === 0 ? (
        <Card className="p-4 text-center text-slate-500">
          <p>No sources available</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {sources.map((source) => (
            <Card key={source.id} className="p-4">
              <div className="space-y-3">
                {/* Source Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">{getSourceTypeIcon(source.sourceType)}</span>
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        {source.sourceType}
                      </span>
                    </div>
                    <h5 className="font-medium text-slate-900 leading-tight mb-1">
                      {source.title}
                    </h5>
                    {source.author && (
                      <p className="text-sm text-slate-600">by {source.author}</p>
                    )}
                    {source.publishDate && (
                      <p className="text-xs text-slate-500">{source.publishDate}</p>
                    )}
                  </div>
                  
                  {/* Credibility Badge */}
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getCredibilityColor(source.credibilityScore)}`}>
                    {getCredibilityLabel(source.credibilityScore)} ({source.credibilityScore}/10)
                  </div>
                </div>

                {/* Source Summary */}
                <p className="text-sm text-slate-700 line-clamp-2">
                  {source.summary}
                </p>

                {/* Key Quotes (if expanded) */}
                {expandedSource === source.id && source.keyQuotes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <h6 className="text-sm font-medium text-slate-900">Key Quotes:</h6>
                    <div className="space-y-2">
                      {source.keyQuotes.map((quote, index) => (
                        <blockquote key={index} className="border-l-4 border-slate-300 pl-3 text-sm text-slate-700 italic">
                          "{quote}"
                        </blockquote>
                      ))}
                    </div>
                  </div>
                )}

                {/* Source Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span>Relevance: {source.relevanceScore}/10</span>
                    {source.keyQuotes.length > 0 && (
                      <span>{source.keyQuotes.length} quotes</span>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {source.keyQuotes.length > 0 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleExpanded(source.id)}
                      >
                        {expandedSource === source.id ? 'Hide Details' : 'Show Details'}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openExternalLink(source.url)}
                    >
                      View Source
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Sources Summary */}
      {sources.length > 0 && (
        <Card className="p-3 bg-slate-50">
          <div className="text-xs text-slate-600 space-y-1">
            <div className="flex items-center justify-between">
              <span>Source Types:</span>
              <span>
                {Object.entries(
                  sources.reduce((acc, source) => {
                    acc[source.sourceType] = (acc[source.sourceType] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([type, count]) => `${type}: ${count}`).join(', ')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Average Relevance:</span>
              <span>{(sources.reduce((sum, s) => sum + s.relevanceScore, 0) / sources.length).toFixed(1)}/10</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 