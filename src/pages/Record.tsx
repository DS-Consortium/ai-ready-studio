          {/* ── BOTTOM CONTROL AREA (Snapchat-style) ── */}
          <div className="flex flex-col items-center justify-center space-y-6 pb-4">
            {/* Filter carousel scrolls into the record button */}
            {recordingState === "idle" && (
              <div className="w-full flex justify-center">
                <div
                  ref={filterScrollRef}
                  className="flex overflow-x-auto gap-4 no-scrollbar px-6 items-center justify-center snap-x snap-mandatory"
                  style={{ scrollBehavior: "smooth", scrollSnapType: "x mandatory" }}
                >
                  {/* Spacers to center first filter */}
                  <div className="w-12 flex-shrink-0" />
                  
                  {AI_FILTERS.map((filter) => {
                    const cfg = getLensConfig(filter);
                    const isSelected = selectedFilter?.id === filter.id;
                    return (
                      <button
                        key={filter.id}
                        onClick={() => setSelectedFilter(filter)}
                        className={`flex-shrink-0 flex flex-col items-center gap-2 transition-all duration-300 snap-center ${
                          isSelected ? "scale-100" : "scale-60 opacity-40"
                        }`}
                      >
                        <div
                          className={`rounded-full border-4 flex items-center justify-center transition-all ${
                            isSelected ? "w-20 h-20 border-white shadow-2xl" : "w-14 h-14 border-white/20"
                          }`}
                          style={{
                            backgroundColor: `${cfg.color}33`,
                            borderColor: isSelected ? "#fff" : `${cfg.color}44`,
                          }}
                        >
                          <filter.icon
                            className={isSelected ? "w-10 h-10" : "w-6 h-6"}
                            style={{ color: cfg.color }}
                          />
                        </div>
                        <span
                          className={`font-bold tracking-wide text-center leading-tight ${
                            isSelected ? "text-xs" : "text-[8px]"
                          }`}
                          style={{ color: isSelected ? "#fff" : "rgba(255,255,255,0.4)" }}
                        >
                          {filter.shortName}
                        </span>
                      </button>
                    );
                  })}
                  
                  {/* Spacers to center last filter */}
                  <div className="w-12 flex-shrink-0" />
                </div>
              </div>
            )}

            {/* Record / Stop / Submit controls — centered */}
            <div className="flex justify-center items-center">
              {recordingState === "idle" && (
                <button
                  onClick={startRecording}
                  className="w-24 h-24 rounded-full border-4 border-white p-1 active:scale-95 transition-transform shadow-2xl"
                >
                  <div className="w-full h-full rounded-full bg-white" />
                </button>
              )}

              {recordingState === "recording" && (
                <button
                  onClick={stopRecording}
                  className="w-24 h-24 rounded-full border-4 border-white p-1 active:scale-95 transition-transform shadow-2xl"
                >
                  <div className="w-full h-full rounded-full bg-red-500 flex items-center justify-center">
                    <Square className="text-white fill-white w-8 h-8" />
                  </div>
                </button>
              )}

              {recordingState === "preview" && (
                <div className="flex gap-4 bg-black/50 backdrop-blur-xl p-4 rounded-3xl border border-white/20">
                  <Button
                    variant="ghost"
                    onClick={resetRecording}
                    className="text-white gap-2"
                  >
                    <RotateCcw className="w-5 h-5" /> Retake
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-white text-black hover:bg-white/90 gap-2"
                  >
                    <Check className="w-5 h-5" /> Submit
                  </Button>
                </div>
              )}

              {recordingState === "uploading" && (
                <div className="flex items-center gap-3 text-white">
                  <div className="h-8 w-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">Uploading…</span>
                </div>
              )}
            </div>
          </div>
