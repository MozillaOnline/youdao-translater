cfx xpi
unzip youdao-translater.xpi install.rdf
patch -p1 < install.rdf.patch
zip youdao-translater.xpi install.rdf
rm install.rdf
rm install.rdf.orig
