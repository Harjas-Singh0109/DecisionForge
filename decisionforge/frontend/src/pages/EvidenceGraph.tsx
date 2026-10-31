import React, { useState, useEffect, useMemo } from 'react';
import { 
  ReactFlow, Background, Controls, MiniMap, type Node, type Edge, 
  MarkerType, useNodesState, useEdgesState 
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { 
  Network, ExternalLink, X, Info, Search, Filter, 
  CheckCircle2, ShieldAlert, BookOpen, Sparkles, Eye, ArrowUpRight
} from 'lucide-react';
import type { EvidenceNetwork, Investigation } from '../types';
import { api } from '../services/api';

interface EvidenceGraphProps {
  investigation: Investigation | null;
}

export const EvidenceGraph: React.FC<EvidenceGraphProps> = ({ investigation }) => {
  const [evidenceData, setEvidenceData] = useState<EvidenceNetwork | null>(null);
  const [selectedItem, setSelectedItem] = useState<{ type: string; data: any } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'verified' | 'contradictory' | 'sources'>('all');
  const [isLoading, setIsLoading] = useState(false);

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  useEffect(() => {
    if (!investigation) return;
    setIsLoading(true);
    api.getEvidence(investigation.id)
      .then((data) => {
        setEvidenceData(data);
        buildGraph(data, investigation.question, searchQuery, activeFilter);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [investigation?.id]);

  // Rebuild graph when filter or search changes
  useEffect(() => {
    if (evidenceData && investigation) {
      buildGraph(evidenceData, investigation.question, searchQuery, activeFilter);
    }
  }, [searchQuery, activeFilter]);

  const buildGraph = (
    data: EvidenceNetwork, 
    question: string, 
    search: string,
    filter: string
  ) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];
    const searchLower = search.toLowerCase().trim();

    // 1. Root Decision Node
    const rootId = 'root-decision';
    const isRootMatch = !searchLower || question.toLowerCase().includes(searchLower);

    newNodes.push({
      id: rootId,
      position: { x: 480, y: 40 },
      data: { 
        label: (
          <div className="p-3 text-center">
            <span className="text-[9px] font-extrabold text-[#4F6BFF] uppercase tracking-wider block">Decision Root</span>
            <span className="text-xs font-black text-white line-clamp-2">{question}</span>
          </div>
        ),
        raw: { title: question, type: 'decision' }
      },
      style: {
        background: '#1E293B',
        color: '#fff',
        border: isRootMatch ? '2px solid #6366F1' : '1px solid #334155',
        borderRadius: '14px',
        width: 320,
        boxShadow: isRootMatch ? '0 0 30px rgba(99, 102, 241, 0.35)' : 'none',
        opacity: isRootMatch ? 1 : 0.4
      }
    });

    // 2. Canonical Alternative Nodes (Deduplicated)
    const altY = 200;
    const seenAltNames = new Set<string>();
    const uniqueAlts: typeof data.alternatives = [];
    const altIdRemap: Record<string, string> = {};

    (data.alternatives || []).forEach((alt) => {
      const key = (alt.name || '').trim().toLowerCase();
      if (!key) return;
      if (!seenAltNames.has(key)) {
        seenAltNames.add(key);
        uniqueAlts.push(alt);
        altIdRemap[alt.id] = alt.id;
      } else {
        const primary = uniqueAlts.find((a) => (a.name || '').trim().toLowerCase() === key);
        if (primary) {
          altIdRemap[alt.id] = primary.id;
        }
      }
    });

    const alts = uniqueAlts;
    const altSpacing = Math.max(760 / (alts.length || 1), 380);

    alts.forEach((alt, idx) => {
      const altX = 180 + idx * altSpacing;
      const isAltMatch = !searchLower || alt.name.toLowerCase().includes(searchLower) || (alt.description || '').toLowerCase().includes(searchLower);

      newNodes.push({
        id: `alt-${alt.id}`,
        position: { x: altX, y: altY },
        data: {
          label: (
            <div className="p-3 text-center">
              <span className="text-[9px] font-bold text-[#A78BFA] uppercase tracking-wider block">Strategic Alternative</span>
              <span className="text-xs font-bold text-white line-clamp-2">{alt.name}</span>
            </div>
          ),
          raw: { ...alt, type: 'alternative' }
        },
        style: {
          background: '#243048',
          color: '#fff',
          border: '1.5px solid #8B5CF6',
          borderRadius: '12px',
          width: 240,
          boxShadow: isAltMatch ? '0 0 20px rgba(139, 92, 246, 0.25)' : 'none',
          opacity: isAltMatch ? 1 : 0.4
        }
      });

      newEdges.push({
        id: `e-root-alt-${alt.id}`,
        source: rootId,
        target: `alt-${alt.id}`,
        animated: true,
        style: { stroke: '#8B5CF6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#8B5CF6' }
      });
    });

    // 3. Claim Nodes
    const claims = data.claims || [];
    const claimY = 380;
    
    // Filter claims if filter is active
    const filteredClaims = claims.filter(c => {
      if (filter === 'verified') return c.evidence_quality === 'Verified support';
      if (filter === 'contradictory') return c.evidence_quality === 'Contradictory evidence';
      return true;
    });

    filteredClaims.slice(0, 10).forEach((claim, cIdx) => {
      const claimX = 60 + cIdx * 175;
      const isVerified = claim.evidence_quality === 'Verified support';
      const isContradictory = claim.evidence_quality === 'Contradictory evidence';
      const isPartial = claim.evidence_quality === 'Partial support';

      const borderCol = isVerified ? '#10B981' : isContradictory ? '#F43F5E' : isPartial ? '#F59E0B' : '#94A3B8';
      const bgCol = isVerified ? '#0A1C16' : isContradictory ? '#220D12' : '#1E293B';

      const isClaimMatch = !searchLower || claim.claim_text.toLowerCase().includes(searchLower) || (claim.explanation || '').toLowerCase().includes(searchLower);

      newNodes.push({
        id: `claim-${claim.id}`,
        position: { x: claimX, y: claimY },
        data: {
          label: (
            <div className="p-2.5 text-left">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-extrabold uppercase tracking-wider" style={{ color: borderCol }}>
                  {claim.evidence_quality}
                </span>
              </div>
              <span className="text-[10px] text-white line-clamp-3 leading-tight block">{claim.claim_text}</span>
            </div>
          ),
          raw: { ...claim, type: 'claim' }
        },
        style: {
          background: bgCol,
          color: '#fff',
          border: `1.5px solid ${borderCol}`,
          borderRadius: '10px',
          width: 160,
          boxShadow: isVerified ? '0 0 15px rgba(16, 185, 129, 0.2)' : isContradictory ? '0 0 15px rgba(244, 63, 94, 0.2)' : 'none',
          opacity: isClaimMatch ? 1 : 0.35
        }
      });

      // Connect Alternative to Claim (using remapped alternative ID)
      if (claim.alternative_id) {
        const canonicalAltId = altIdRemap[claim.alternative_id] || claim.alternative_id;
        newEdges.push({
          id: `e-alt-claim-${claim.id}`,
          source: `alt-${canonicalAltId}`,
          target: `claim-${claim.id}`,
          style: { 
            stroke: isContradictory ? '#F43F5E' : '#4F6BFF', 
            strokeWidth: 1.5, 
            strokeDasharray: isContradictory ? '4 4' : undefined 
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isContradictory ? '#F43F5E' : '#4F6BFF' }
        });
      }
    });

    // 4. Source Reference Nodes
    if (filter === 'all' || filter === 'sources') {
      const sources = data.sources || [];
      const sourceY = 570;
      sources.slice(0, 6).forEach((src, sIdx) => {
        const srcX = 140 + sIdx * 210;
        const isSrcMatch = !searchLower || src.title.toLowerCase().includes(searchLower) || (src.publisher || '').toLowerCase().includes(searchLower);

        newNodes.push({
          id: `src-${src.id}`,
          position: { x: srcX, y: sourceY },
          data: {
            label: (
              <div className="p-2.5 text-left">
                <span className="text-[8px] font-extrabold text-[#4F6BFF] uppercase tracking-wider block">Primary Source</span>
                <span className="text-[10px] font-bold text-white line-clamp-2 block leading-tight">{src.title}</span>
                <span className="text-[8px] text-[#94A3B8] mt-0.5 block truncate">{src.publisher || 'Verified Repository'}</span>
              </div>
            ),
            raw: { ...src, type: 'source' }
          },
          style: {
            background: '#1E293B',
            color: '#fff',
            border: '1px solid #6366F1',
            borderRadius: '10px',
            width: 190,
            opacity: isSrcMatch ? 1 : 0.35
          }
        });
      });

      // 5. Connect Evidence Links (Claim -> Source)
      (data.evidence_links || []).forEach((link, lIdx) => {
        const isContradicting = link.relationship_type === 'contradicting';
        // Only link if both nodes exist in the current rendered node list
        const claimExists = newNodes.some(n => n.id === `claim-${link.claim_id}`);
        const srcExists = newNodes.some(n => n.id === `src-${link.source_id}`);

        if (claimExists && srcExists) {
          newEdges.push({
            id: `e-link-${lIdx}`,
            source: `claim-${link.claim_id}`,
            target: `src-${link.source_id}`,
            style: { 
              stroke: isContradicting ? '#F43F5E' : '#10B981', 
              strokeWidth: 1.5, 
              strokeDasharray: isContradicting ? '3 3' : undefined 
            },
            markerEnd: { type: MarkerType.ArrowClosed, color: isContradicting ? '#F43F5E' : '#10B981' }
          });
        }
      });
    }

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const handleNodeClick = (_: any, node: Node) => {
    if (node.data && node.data.raw) {
      setSelectedItem({
        type: (node.data.raw as any).type,
        data: node.data.raw
      });
    }
  };

  if (!investigation) {
    return (
      <div className="p-16 text-center text-[#94A3B8]">
        <Network className="w-12 h-12 mx-auto text-[#4F6BFF]/40 mb-3 animate-pulse" />
        <h3 className="text-lg font-bold text-white">No Active Investigation Selected</h3>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex relative bg-[#060810] overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Search Input */}
        <div className="flex items-center gap-2 bg-[#1E293B]/90 backdrop-blur-md border border-[#1E293B] rounded-xl px-3 py-1.5 shadow-xl pointer-events-auto w-72">
          <Search className="w-3.5 h-3.5 text-[#94A3B8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims, sources, nodes..."
            className="bg-transparent text-xs text-white placeholder-[#64748B] focus:outline-none w-full"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-[#94A3B8] hover:text-white text-xs">✕</button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-[#1E293B]/90 backdrop-blur-md border border-[#1E293B] rounded-xl p-1 shadow-xl pointer-events-auto">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'all' ? 'bg-[#4F6BFF] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            All Entities
          </button>
          <button
            onClick={() => setActiveFilter('verified')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'verified' ? 'bg-[#10B981] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Verified Only
          </button>
          <button
            onClick={() => setActiveFilter('contradictory')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'contradictory' ? 'bg-[#F43F5E] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Contradictions
          </button>
          <button
            onClick={() => setActiveFilter('sources')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeFilter === 'sources' ? 'bg-[#3B82F6] text-white shadow-md' : 'text-[#94A3B8] hover:text-white'
            }`}
          >
            Sources
          </button>
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 h-full w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          fitView
          attributionPosition="bottom-left"
        >
          <Background color="#334155" gap={24} size={1} />
          <Controls className="bg-[#1E293B] border border-[#334155] text-white rounded-xl overflow-hidden fill-white" />
          <MiniMap 
            nodeColor={(n) => (
              n.id.includes('root') ? '#6366F1' : 
              n.id.includes('alt') ? '#8B5CF6' : 
              n.id.includes('src') ? '#3B82F6' : 
              (n.data?.raw as any)?.evidence_quality === 'Verified support' ? '#10B981' :
              (n.data?.raw as any)?.evidence_quality === 'Contradictory evidence' ? '#F43F5E' : '#F59E0B'
            )}
            className="bg-[#1E293B] border border-[#334155] rounded-xl"
          />
        </ReactFlow>

        {/* Legend Overlay */}
        <div className="absolute bottom-6 left-6 bg-[#1E293B]/95 backdrop-blur-md border border-[#334155] rounded-xl p-3 text-xs space-y-1.5 pointer-events-auto shadow-2xl">
          <div className="font-extrabold text-white text-[11px] mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[#818CF8]" /> Meridian Graph Topology
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#6366F1]" /> Strategic Decision Root
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#94A3B8]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6]" /> Hypotheses & Strategic Alternatives
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#10B981]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" /> Verified Empirical Claim
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#F43F5E]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F43F5E]" /> Contradictory Evidence (Critic)
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#3B82F6]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" /> Primary Citation Reference
          </div>
        </div>
      </div>

      {/* Selected Node Details Side-Drawer (Meridian Style) */}
      {selectedItem && (
        <div className="w-96 bg-[#1E293B] border-l border-[#334155] p-6 flex flex-col justify-between overflow-y-auto z-20 shadow-2xl animate-fadeIn">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#334155]">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#818CF8]">
                {selectedItem.type.toUpperCase()} INSPECTOR
              </span>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-[#94A3B8] hover:text-white p-1 rounded-lg hover:bg-[#243048] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Claim Details */}
              {selectedItem.type === 'claim' && (
                <>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Claim Statement</span>
                    <p className="text-xs text-white leading-relaxed font-semibold bg-[#243048] p-3 rounded-xl border border-[#334155]">
                      {selectedItem.data.claim_text}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Evidence Audit Label</span>
                    <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border ${
                      selectedItem.data.evidence_quality === 'Verified support'
                        ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/30'
                        : selectedItem.data.evidence_quality === 'Contradictory evidence'
                        ? 'bg-[#F43F5E]/20 text-[#FB7185] border-[#F43F5E]/30'
                        : 'bg-[#F59E0B]/20 text-[#FBBF24] border-[#F59E0B]/30'
                    }`}>
                      {selectedItem.data.evidence_quality}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Audit Justification</span>
                    <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#243048] p-3 rounded-xl border border-[#334155]">
                      {selectedItem.data.explanation || 'Directly substantiated against source excerpt.'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Agent Origin</span>
                    <span className="text-xs text-[#A78BFA] font-semibold">{selectedItem.data.agent_origin || 'Literature Agent'}</span>
                  </div>

                  {/* Supporting Primary Source */}
                  {(() => {
                    const link = (evidenceData?.evidence_links || []).find((l) => l.claim_id === selectedItem.data.id);
                    const src = link 
                      ? (evidenceData?.sources || []).find((s) => s.id === link.source_id)
                      : (evidenceData?.sources?.[0]);
                    return src?.url ? (
                      <div className="pt-3 border-t border-[#334155] space-y-2">
                        <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Supporting Primary Source</span>
                        <div className="p-3 rounded-xl bg-[#243048] border border-[#334155]">
                          <p className="text-xs font-bold text-white leading-tight mb-1">{src.title}</p>
                          <p className="text-[10px] text-[#94A3B8]">{src.publisher || 'Verified Repository'}</p>
                        </div>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#4F6BFF]/25 cursor-pointer"
                        >
                          <span>Open Primary Source URL</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ) : null;
                  })()}
                </>
              )}

              {/* Source Details */}
              {selectedItem.type === 'source' && (
                <>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Source Title</span>
                    <h4 className="text-xs font-bold text-white leading-tight">{selectedItem.data.title}</h4>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Publisher & Date</span>
                    <p className="text-xs text-[#CBD5E1]">
                      {selectedItem.data.publisher || 'Independent Registry'} • {selectedItem.data.publication_date || 'Recent Reference'}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Extracted Excerpt</span>
                    <p className="text-[11px] text-[#94A3B8] leading-relaxed bg-[#060810] p-3 rounded-xl border border-[#1E293B] max-h-48 overflow-y-auto font-mono">
                      {selectedItem.data.extracted_content || selectedItem.data.content || 'Validated source excerpt.'}
                    </p>
                  </div>
                  {selectedItem.data.url && (
                    <a
                      href={selectedItem.data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#4F6BFF] to-[#8B5CF6] hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-[#4F6BFF]/25 cursor-pointer"
                    >
                      <span>Open Verified URL</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </>
              )}

              {/* Alternative Details */}
              {selectedItem.type === 'alternative' && (
                <>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Alternative Name</span>
                    <h4 className="text-sm font-bold text-white">{selectedItem.data.name}</h4>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#94A3B8] uppercase font-bold block mb-1">Strategic Description</span>
                    <p className="text-xs text-[#CBD5E1] leading-relaxed bg-[#060810] p-3.5 rounded-xl border border-[#1E293B]">
                      {selectedItem.data.description || 'Competing strategic path.'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
