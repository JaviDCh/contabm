
Meteor.publish('gruposContables', function () {
    return GruposContables.find();
});
