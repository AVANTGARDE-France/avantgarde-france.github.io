#include <phonemis/base/config.h>
#include <phonemis/base/pipeline.h>
#include <phonemis/utils/conversions.h>

#include <emscripten/bind.h>

#include <memory>
#include <stdexcept>
#include <string>

namespace {

std::unique_ptr<phonemis::Pipeline> g_pipeline;
std::string g_model_path;

void ensure_pipeline(const std::string& model_path) {
    if (g_pipeline && g_model_path == model_path) {
        return;
    }

    phonemis::Config config;
    config.lang = "fr";
    config.phonemizer.lang = "fr";
    config.phonemizer.nn_model_filepath = model_path;

    g_pipeline = std::make_unique<phonemis::Pipeline>(config);
    g_model_path = model_path;
}

std::string phonemize_french(
    const std::string& text,
    const std::string& model_path
) {
    if (text.empty()) {
        return {};
    }

    ensure_pipeline(model_path);

    const std::u32string result =
        (*g_pipeline)(text);

    return phonemis::utils::conversions::u32_to_utf8(result);
}

void reset_pipeline() {
    g_pipeline.reset();
    g_model_path.clear();
}

} // namespace

EMSCRIPTEN_BINDINGS(phonemis_web) {
    emscripten::function(
        "phonemizeFrench",
        &phonemize_french
    );

    emscripten::function(
        "reset",
        &reset_pipeline
    );
}
