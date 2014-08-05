cfx xpi
xpiname=$(ls -ct *.xpi | head -1)
zip $xpiname install.rdf
