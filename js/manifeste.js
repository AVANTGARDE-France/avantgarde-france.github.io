 (_) {}
                    }

                    terminerErreur(
                        new Error(
                            "Piper : aucun phonème français retourné."
                        )
                    );
                } catch (error) {
                    terminerErreur(error);
                }
            }

            Promise.resolve()
                .then(function () {
                    return factory({
                        print: function (ligne) {
                            terminerSucces(ligne);
                        },

                        printErr: function (ligne) {
                            console.warn(
                                "AVANT-GARDE — Piper :",
                                ligne
                            );
                        },

                        locateFile: function (file) {
                            if (
                                file.endsWith(".wasm")
                            ) {
                                return (
                                    PIPER_PHONEMIZER_BASE +
                                    ".wasm"
                                );
                            }

                            if (
                                file.endsWith(".data")
                            ) {
                                return (
                                    PIPER_PHONEMIZER_BASE +
                                    ".data"
                                );
                            }

                            return file;
                        }
                    });
                })
                .then(function (module) {
                    module.callMain([
                        "-l",
                        "fr-fr",
                        "--input",
                        JSON.stringify([
                            {
                                text:
                                    String(texte)
                                        .trim()
                            }
                        ]),
                        "--espeak_data",
                        "/espeak-ng-data"
                    ]);
                })
                .catch(terminerErreur);
        }),
        30000,
        "Piper : phonémisation française trop longue."
    );
}

