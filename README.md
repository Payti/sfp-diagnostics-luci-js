# SFP Diagnostics for LuCI

Rozszerzenie LuCI dla OpenWrt 25.12 przeznaczone dla Banana Pi BPi-R3. Dodaje stronę diagnostyczną dla modułów SFP1 (WAN) i SFP2 (LAN), wykorzystując dane DDM odczytywane przez `ethtool -m`.

## Funkcje

- status linku dla obu interfejsów SFP,
- producent, numer katalogowy, numer seryjny i dane identyfikacyjne modułu,
- temperatura, napięcie, prąd bias oraz moc TX/RX w dBm i mW,
- długość fali, bitrate, kodowanie, zasięg SMF i obsługiwane standardy,
- aktywne alarmy i zaimplementowane opcje modułu,
- historia temperatury oraz mocy TX/RX z wykresami w bieżącej sesji LuCI,
- ręczne i automatyczne odświeżanie danych,
- tłumaczenie interfejsu na język angielski.

## Wymagania

- Banana Pi BPi-R3 z OpenWrt 25.12,
- LuCI i `rpcd`,
- dostępne polecenie `ethtool` z obsługą `ethtool -m`,
- zamontowany debugfs (`/sys/kernel/debug`),
- interfejsy nazwane `sfp1` i `sfp2`.

Sprawdzenie środowiska:

```sh
which ethtool
ethtool -m sfp1
ip link show sfp1
mount | grep debugfs
```

## Instalacja

Repozytorium zawiera pliki w układzie odpowiadającym głównemu katalogowi systemu OpenWrt. W katalogu projektu wykonaj:

```sh
scp -r etc usr root@ADRES_ROUTERA:/tmp/sfp-diagnostics-luci-js/
scp -r www root@ADRES_ROUTERA:/tmp/sfp-diagnostics-luci-js/
ssh root@ADRES_ROUTERA
cd /tmp/sfp-diagnostics-luci-js
cp -a etc usr www /
chmod 755 /usr/libexec/rpcd/sfp
/etc/init.d/rpcd restart
rm -rf /tmp/luci-indexcache
```

Następnie otwórz LuCI i przejdź do **Network -> SFP**. W razie potrzeby wyloguj się i zaloguj ponownie, aby odświeżyć uprawnienia ACL.

## Instalacja bezpośrednio z lokalnego katalogu

Jeśli pliki zostały skopiowane do `/tmp/sfp-diagnostics-luci-js`, można użyć:

```sh
cp -a /tmp/sfp-diagnostics-luci-js/etc /tmp/sfp-diagnostics-luci-js/usr /tmp/sfp-diagnostics-luci-js/www /
chmod 755 /usr/libexec/rpcd/sfp
/etc/init.d/rpcd restart
rm -rf /tmp/luci-indexcache
```

## Sprawdzenie RPCD

Backend udostępnia metodę `status` obiektu UBus `sfp`:

```sh
ubus -v list sfp
echo '{"interface":"sfp1"}' | /usr/libexec/rpcd/sfp call status
```

Puste dane `ethtool` są zwracane jako `{}`. Oznacza to zwykle brak modułu, brak obsługi odczytu EEPROM albo nieprawidłową nazwę interfejsu.

## Struktura

```text
etc/sfp.json                              konfiguracja ścieżek debugfs
usr/libexec/rpcd/sfp                      backend RPCD/UBus
usr/share/luci/menu.d/...                 wpis menu LuCI
usr/share/rpcd/acl.d/...                  uprawnienia ACL
www/luci-static/resources/view/network/sfp.js  widok LuCI
```

## Uwagi

Historia wykresów jest przechowywana w `sessionStorage` przeglądarki i jest ograniczona do 120 pomiarów na interfejs. Dane zależą od formatu wyjścia `ethtool`; różnice między sterownikami lub modułami mogą wymagać dostosowania parsera w `usr/libexec/rpcd/sfp`.

## Licencja

Brak licencji nie został zadeklarowany. Przed publicznym wykorzystaniem projektu dodaj licencję odpowiednią do planowanego sposobu dystrybucji.
