#include <emscripten/bind.h>
#include <phonemis/base/config.h>
#include <phonemis/base/pipeline.h>
#include <phonemis/utils/conversions.h>

#include <memory>
#include <stdexcept>
#include <string>

namespace {

std::unique_ptr<phonemis::Pipeline> g_pipeline;

void initPhonemis(const std::string& modelPath) {
    phonemis::Config config;
    config.lang = "fr";
    config.phonemizer.lang = "fr";
    config.phonemizer.nn_model_filepath = modelPath;

    g_pipeline = std::make_unique<phonemis::Pipeline>(config);
}

std::string phonemizeFrench(const std::string& text) {
    if (!g_pipeline) {
        throw std::runtime_error("Phonemis n'est pas initialisé.");
    }

    const auto phonemes = (*g_pipeline)(text, true, true);
    return phonemis::utils::conversions::u32_to_utf8(phonemes);
}

void resetPhonemis() {\n    g_pipeline.reset();\n}\n\nbool ready() {
    return static_cast<bool>(g_pipeline);
}

} // namespace

EMSCRIPTEN_BINDINGS(avant_garde_phonemis) {
    emscripten::function("initPhonemis", &initPhonemis);
    emscripten::function("phonemizeFrench", &phonemizeFrench);
    emscripten::function("ready", &ready);
}
